/**
 * Script de importación batch de procedimientos desde archivos Markdown.
 *
 * Uso:
 *   npx tsx scripts/import-procedimientos.ts <directorio> [--categoria <nombre>] [--dry-run]
 *
 * Formato esperado del frontmatter en cada .md:
 *   ---
 *   titulo: "Título del procedimiento"
 *   codigo: PRO-INF-001          # opcional – se genera automático si falta
 *   version: "1.0"               # opcional
 *   area: Infraestructura        # opcional
 *   responsable: Juan Pérez      # opcional
 *   estado: Vigente              # Vigente | Borrador | Obsoleto  (default: Borrador)
 *   fechaRevision: 2025-06-01    # opcional
 *   categoria: Redes             # optional override
 *   ---
 *
 *   Contenido en markdown...
 */

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

// ── helpers ─────────────────────────────────────────────────────────────────

function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const meta: Record<string, string> = {};
  if (!raw.startsWith('---')) return { meta, body: raw };
  const end = raw.indexOf('\n---', 3);
  if (end === -1) return { meta, body: raw };
  const frontLines = raw.slice(3, end).trim().split('\n');
  for (const line of frontLines) {
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const value = line.slice(colon + 1).trim().replace(/^["']|["']$/g, '');
    meta[key] = value;
  }
  return { meta, body: raw.slice(end + 4).trim() };
}

function mdToHtml(md: string): string {
  return md
    // h2/h3
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    // bold/italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // inline code
    .replace(/`([^`]+)`/g, '<code style="background:#1e293b;color:#e2e8f0;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:13px;">$1</code>')
    // fenced code blocks
    .replace(/```[\w]*\n([\s\S]*?)```/g, '<pre style="background:#1e293b;color:#e2e8f0;padding:12px;border-radius:6px;overflow-x:auto;font-family:monospace;font-size:13px;"><code>$1</code></pre>')
    // warning/info blocks
    .replace(/^> ⚠️(.+)$/gm, '<div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:4px;margin:12px 0;">⚠️<strong>Advertencia:</strong>$1</div>')
    .replace(/^> ℹ️(.+)$/gm, '<div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:12px 16px;border-radius:4px;margin:12px 0;">ℹ️<strong>Nota:</strong>$1</div>')
    .replace(/^> (.+)$/gm, '<blockquote style="border-left:3px solid #6b7280;padding:4px 12px;color:#6b7280;margin:8px 0;">$1</blockquote>')
    // ordered/unordered lists (simple single-level)
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    .replace(/^[-*] (.+)$/gm, '<li>$2</li>')
    // wrap consecutive <li> in <ol>/<ul>
    .replace(/(<li>.*<\/li>\n?)+/gs, match => `<ul>${match}</ul>`)
    // paragraphs
    .split(/\n\n+/)
    .map(block => {
      if (/^<(h[1-6]|ul|ol|div|pre|blockquote)/.test(block.trim())) return block.trim();
      return `<p>${block.trim().replace(/\n/g, '<br>')}</p>`;
    })
    .join('\n');
}

async function getOrCreateCategoria(nombre: string): Promise<number> {
  let cat = await prisma.categoria.findFirst({ where: { nombre: { equals: nombre, mode: 'insensitive' } } });
  if (!cat) {
    cat = await prisma.categoria.create({ data: { nombre } });
    console.log(`  📁 Categoría creada: "${nombre}"`);
  }
  return cat.id;
}

async function getNextCodigo(area: string): Promise<string> {
  const prefix = `PRO-${area.toUpperCase().substring(0, 3)}-`;
  const articulos = await prisma.articulo.findMany({
    where: { codigo: { startsWith: prefix } },
    select: { codigo: true }
  });
  let max = 0;
  for (const a of articulos) {
    const m = a.codigo?.match(/-(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1]));
  }
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
}

// ── main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Uso: npx tsx scripts/import-procedimientos.ts <directorio> [--categoria <nombre>] [--dry-run]');
    process.exit(1);
  }

  const dir = args[0];
  const dryRun = args.includes('--dry-run');
  const catIdx = args.indexOf('--categoria');
  const defaultCategoria = catIdx !== -1 ? args[catIdx + 1] : 'General';

  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    console.error(`❌ El directorio "${dir}" no existe.`);
    process.exit(1);
  }

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
  if (files.length === 0) {
    console.error(`❌ No se encontraron archivos .md en "${dir}".`);
    process.exit(1);
  }

  console.log(`\n📂 Importando ${files.length} archivo(s) desde "${dir}"`);
  if (dryRun) console.log('🔍 MODO DRY-RUN — no se escribirá nada en la base de datos\n');

  // Obtener usuario admin para creadoPorId
  const adminUser = await prisma.usuario.findFirst({ where: { rol: { nombre: 'admin' } } })
    ?? await prisma.usuario.findFirst();
  if (!adminUser) { console.error('❌ No hay usuarios en la base de datos.'); process.exit(1); }

  const ESTADOS_VALIDOS = ['Vigente', 'Borrador', 'Obsoleto'];
  const results: { file: string; status: 'ok' | 'error' | 'skipped'; msg?: string }[] = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { meta, body } = parseFrontmatter(raw);

    // Validar campos obligatorios
    const titulo = meta.titulo || path.basename(file, '.md');
    if (!titulo.trim()) {
      results.push({ file, status: 'error', msg: 'Sin título' });
      continue;
    }

    const estadoRaw = meta.estado || 'Borrador';
    const estado = ESTADOS_VALIDOS.includes(estadoRaw) ? estadoRaw : 'Borrador';
    if (!ESTADOS_VALIDOS.includes(estadoRaw)) {
      console.warn(`  ⚠️  ${file}: estado "${estadoRaw}" inválido, se usará "Borrador"`);
    }

    const categoriaNombre = meta.categoria || defaultCategoria;
    const area = meta.area || 'GEN';

    try {
      const categoriaId = dryRun ? 0 : await getOrCreateCategoria(categoriaNombre);

      let codigo = meta.codigo?.trim() || '';
      if (!codigo) {
        codigo = dryRun ? `PRO-${area.substring(0,3).toUpperCase()}-XXX` : await getNextCodigo(area);
        console.log(`  ⚡ ${file}: código asignado automáticamente → ${codigo}`);
      }

      const contenido = mdToHtml(body);

      if (!dryRun) {
        // Verificar si ya existe por código
        const existing = codigo ? await prisma.articulo.findFirst({ where: { codigo } }) : null;
        if (existing) {
          await prisma.articulo.update({
            where: { id: existing.id },
            data: {
              titulo, contenido, categoriaId,
              version: meta.version || '1.0',
              area, responsable: meta.responsable || null,
              estado, fechaRevision: meta.fechaRevision ? new Date(meta.fechaRevision) : null
            }
          });
          results.push({ file, status: 'ok', msg: `Actualizado (id ${existing.id}, ${codigo})` });
        } else {
          const created = await prisma.articulo.create({
            data: {
              titulo, contenido, categoriaId, adjuntos: [],
              creadoPorId: adminUser.id,
              codigo, version: meta.version || '1.0',
              area, responsable: meta.responsable || null,
              estado, fechaRevision: meta.fechaRevision ? new Date(meta.fechaRevision) : null
            }
          });
          results.push({ file, status: 'ok', msg: `Creado (id ${created.id}, ${codigo})` });
        }
      } else {
        results.push({ file, status: 'ok', msg: `[DRY-RUN] ${codigo} — "${titulo}" → ${categoriaNombre}` });
      }
    } catch (err: any) {
      results.push({ file, status: 'error', msg: err.message });
    }
  }

  // ── Reporte ────────────────────────────────────────────────────────────────
  const ok = results.filter(r => r.status === 'ok');
  const errors = results.filter(r => r.status === 'error');

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 REPORTE DE IMPORTACIÓN`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Éxitos:  ${ok.length}`);
  console.log(`❌ Errores: ${errors.length}`);
  console.log('');

  for (const r of results) {
    const icon = r.status === 'ok' ? '✅' : '❌';
    console.log(`${icon}  ${r.file}${r.msg ? `  →  ${r.msg}` : ''}`);
  }

  if (errors.length > 0) process.exitCode = 1;
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
