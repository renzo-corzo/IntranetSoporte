export type EstadoTarea =
  | 'pendiente'
  | 'en_curso'
  | 'bloqueada'
  | 'en_espera'
  | 'resuelta'
  | 'cancelada';

export type PrioridadTarea = 'baja' | 'media' | 'alta' | 'critica';

export interface Usuario {
  id: number;
  nombre: string;
  email?: string;
}

export interface Comentario {
  id: number;
  contenido: string;
  creadaEn: string;
  autor?: { id: number; nombre: string };
}

export interface Tarea {
  id: number;
  titulo: string;
  descripcion?: string;
  estado: EstadoTarea;
  prioridad: PrioridadTarea;
  categoria?: string;
  origen?: string;
  impacto?: string;
  solicitante?: string;
  activoRelacionado?: string;
  observaciones?: string;
  fechaVencimiento?: string;
  fechaCierre?: string;
  creadaEn: string;
  actualizadaEn: string;
  responsable?: Usuario;
  responsableId?: number;
  creadaPor?: Usuario;
  creadaPorId: number;
  comentarios?: Comentario[];
}

export interface KpisTareas {
  total: number;
  abiertas: number;
  criticas: number;
  vencidas: number;
  resueltasHoy: number;
  sinAsignar: number;
}

export const ESTADOS: { value: EstadoTarea; label: string; color: string }[] = [
  { value: 'pendiente',  label: 'Pendiente',  color: '#888780' },
  { value: 'en_curso',   label: 'En curso',   color: '#185FA5' },
  { value: 'bloqueada',  label: 'Bloqueada',  color: '#854F0B' },
  { value: 'en_espera',  label: 'En espera',  color: '#534AB7' },
  { value: 'resuelta',   label: 'Resuelta',   color: '#3B6D11' },
  { value: 'cancelada',  label: 'Cancelada',  color: '#A32D2D' },
];

export const PRIORIDADES: { value: PrioridadTarea; label: string; bg: string; text: string }[] = [
  { value: 'baja',    label: 'Baja',    bg: '#EAF3DE', text: '#3B6D11' },
  { value: 'media',   label: 'Media',   bg: '#E6F1FB', text: '#185FA5' },
  { value: 'alta',    label: 'Alta',    bg: '#FAEEDA', text: '#854F0B' },
  { value: 'critica', label: 'Crítica', bg: '#FCEBEB', text: '#A32D2D' },
];

export const COLUMNAS_KANBAN: EstadoTarea[] = [
  'pendiente',
  'en_curso',
  'bloqueada',
  'en_espera',
  'resuelta',
];
