'use client';

interface PublishToggleProps {
  id: string;
  isPublished: boolean;
  onToggle: (id: string, newValue: boolean) => void;
  disabled?: boolean;
}

export function PublishToggle({ id, isPublished, onToggle, disabled = false }: PublishToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isPublished}
      aria-label={isPublished ? 'Publicado — clic para despublicar' : 'Borrador — clic para publicar'}
      onClick={() => onToggle(id, !isPublished)}
      disabled={disabled}
      className="flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {/* Track */}
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent
                    transition-colors duration-200 ease-in-out focus:outline-none
                    ${isPublished ? 'bg-indigo-600' : 'bg-gray-300'}`}
      >
        {/* Thumb */}
        <span
          className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow
                      transform transition duration-200 ease-in-out
                      ${isPublished ? 'translate-x-4' : 'translate-x-0'}`}
        />
      </span>
      <span className={`text-xs font-medium ${isPublished ? 'text-indigo-700' : 'text-gray-400'}`}>
        {isPublished ? 'Publicado' : 'Borrador'}
      </span>
    </button>
  );
}
