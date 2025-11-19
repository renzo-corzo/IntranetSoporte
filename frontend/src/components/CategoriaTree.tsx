import React from 'react';
import { ChevronRightIcon, ChevronDownIcon, FolderIcon, FolderOpenIcon } from '@heroicons/react/24/outline';

interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  padreId?: number;
  subcategorias?: Categoria[];
}

interface CategoriaTreeProps {
  categorias: Categoria[];
  selectedCategoriaId?: number;
  onSelectCategoria: (categoria: Categoria) => void;
  onEditCategoria: (categoria: Categoria) => void;
  onDeleteCategoria: (categoria: Categoria) => void;
  expandedCategories: Set<number>;
  onToggleExpanded: (categoriaId: number) => void;
}

const CategoriaTreeItem: React.FC<{
  categoria: Categoria;
  level: number;
  selectedCategoriaId?: number;
  onSelectCategoria: (categoria: Categoria) => void;
  onEditCategoria: (categoria: Categoria) => void;
  onDeleteCategoria: (categoria: Categoria) => void;
  expandedCategories: Set<number>;
  onToggleExpanded: (categoriaId: number) => void;
}> = ({ 
  categoria, 
  level, 
  selectedCategoriaId, 
  onSelectCategoria, 
  onEditCategoria, 
  onDeleteCategoria,
  expandedCategories,
  onToggleExpanded
}) => {
  const isExpanded = expandedCategories.has(categoria.id);
  const hasSubcategorias = categoria.subcategorias && categoria.subcategorias.length > 0;
  const isSelected = selectedCategoriaId === categoria.id;

  return (
    <div>
      <div 
        className={`
          flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors
          ${isSelected 
            ? 'bg-blue-100 border-l-4 border-blue-500 text-blue-900' 
            : 'hover:bg-gray-50'
          }
        `}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        <div className="flex items-center flex-1" onClick={() => onSelectCategoria(categoria)}>
          {hasSubcategorias && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpanded(categoria.id);
              }}
              className="p-1 hover:bg-gray-200 rounded mr-1"
            >
              {isExpanded ? (
                <ChevronDownIcon className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronRightIcon className="w-4 h-4 text-gray-600" />
              )}
            </button>
          )}
          {!hasSubcategorias && <div className="w-6 mr-1" />}
          
          {isExpanded ? (
            <FolderOpenIcon className="w-5 h-5 text-blue-600 mr-2" />
          ) : (
            <FolderIcon className="w-5 h-5 text-gray-500 mr-2" />
          )}
          
          <span className="font-medium text-sm">{categoria.nombre}</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditCategoria(categoria);
            }}
            className="p-1 hover:bg-blue-100 rounded text-blue-600"
            title="Editar categoría"
          >
            <span className="emoji-icon">✏️</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteCategoria(categoria);
            }}
            className="p-1 hover:bg-red-100 rounded text-red-600"
            title="Eliminar categoría"
          >
            <span className="emoji-icon">🗑️</span>
          </button>
        </div>
      </div>
      
      {isExpanded && hasSubcategorias && (
        <div>
          {categoria.subcategorias!.map((subcategoria) => (
            <CategoriaTreeItem
              key={subcategoria.id}
              categoria={subcategoria}
              level={level + 1}
              selectedCategoriaId={selectedCategoriaId}
              onSelectCategoria={onSelectCategoria}
              onEditCategoria={onEditCategoria}
              onDeleteCategoria={onDeleteCategoria}
              expandedCategories={expandedCategories}
              onToggleExpanded={onToggleExpanded}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CategoriaTree: React.FC<CategoriaTreeProps> = ({
  categorias,
  selectedCategoriaId,
  onSelectCategoria,
  onEditCategoria,
  onDeleteCategoria,
  expandedCategories,
  onToggleExpanded
}) => {
  // Función para construir el árbol jerárquico
  const buildTree = (items: Categoria[]): Categoria[] => {
    const itemMap = new Map<number, Categoria>();
    const roots: Categoria[] = [];

    // Crear mapa de todos los items
    items.forEach(item => {
      itemMap.set(item.id, { ...item, subcategorias: [] });
    });

    // Construir el árbol
    items.forEach(item => {
      const node = itemMap.get(item.id)!;
      if (item.padreId) {
        const parent = itemMap.get(item.padreId);
        if (parent) {
          parent.subcategorias!.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const treeData = buildTree(categorias);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-800">Categorías</h3>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {treeData.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No hay categorías disponibles
          </div>
        ) : (
          treeData.map((categoria) => (
            <CategoriaTreeItem
              key={categoria.id}
              categoria={categoria}
              level={0}
              selectedCategoriaId={selectedCategoriaId}
              onSelectCategoria={onSelectCategoria}
              onEditCategoria={onEditCategoria}
              onDeleteCategoria={onDeleteCategoria}
              expandedCategories={expandedCategories}
              onToggleExpanded={onToggleExpanded}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default CategoriaTree; 