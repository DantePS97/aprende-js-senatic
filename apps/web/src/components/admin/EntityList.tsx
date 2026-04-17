'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { ReorderButtons } from './ReorderButtons';
import { PublishToggle } from './PublishToggle';

interface EntityItem {
  _id: string;
  title: string;
  order: number;
  isPublished: boolean;
}

interface EntityListProps<T extends EntityItem> {
  items: T[];
  onReorder: (id: string, direction: 'up' | 'down') => void;
  onTogglePublish: (id: string, current: boolean) => void;
  onDelete: (item: T) => void;
  onEdit: (item: T) => void;
  pendingReorder: string | null;
  renderExtra?: (item: T) => React.ReactNode;
}

export function EntityList<T extends EntityItem>({
  items,
  onReorder,
  onTogglePublish,
  onDelete,
  onEdit,
  pendingReorder,
  renderExtra,
}: EntityListProps<T>) {
  if (items.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl px-6 py-10 text-center">
        <p className="text-sm text-gray-400">No hay elementos aún.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <ul className="divide-y divide-gray-100" role="list">
        {items.map((item, index) => {
          const isPending = pendingReorder === item._id;

          return (
            <li
              key={item._id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              {/* Order badge */}
              <span className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-500">
                {item.order}
              </span>

              {/* Title */}
              <span className="flex-1 text-sm font-medium text-gray-900 min-w-0 truncate">
                {item.title}
              </span>

              {/* Extra column */}
              {renderExtra && (
                <div className="flex-shrink-0">
                  {renderExtra(item)}
                </div>
              )}

              {/* Published toggle */}
              <div className="flex-shrink-0">
                <PublishToggle
                  id={item._id}
                  isPublished={item.isPublished}
                  onToggle={onTogglePublish}
                />
              </div>

              {/* Reorder buttons */}
              <ReorderButtons
                id={item._id}
                isFirst={index === 0}
                isLast={index === items.length - 1}
                onReorder={(direction) => onReorder(item._id, direction)}
                pending={isPending}
              />

              {/* Edit */}
              <button
                type="button"
                onClick={() => onEdit(item)}
                aria-label={`Editar ${item.title}`}
                className="flex-shrink-0 p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50
                           rounded-lg transition-colors"
              >
                <Pencil className="w-4 h-4" />
              </button>

              {/* Delete */}
              <button
                type="button"
                onClick={() => onDelete(item)}
                aria-label={`Eliminar ${item.title}`}
                className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50
                           rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
