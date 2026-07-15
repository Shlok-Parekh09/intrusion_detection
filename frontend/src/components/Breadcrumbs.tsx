import { ChevronRight } from 'lucide-react';
import './Breadcrumbs.css';

interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  className?: string;
}

export function Breadcrumbs({ items, separator, className = '' }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav className={`breadcrumbs ${className}`} aria-label="Breadcrumb">
      <ol className="breadcrumbs__list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li key={index} className="breadcrumbs__item">
              {isLast ? (
                <span className="breadcrumbs__current" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <>
                  {item.href ? (
                    <a
                      href={item.href}
                      className="breadcrumbs__link"
                      onClick={item.onClick}
                    >
                      {item.label}
                    </a>
                  ) : (
                    <button
                      className="breadcrumbs__link"
                      onClick={item.onClick}
                    >
                      {item.label}
                    </button>
                  )}
                  
                  <span className="breadcrumbs__separator">
                    {separator || <ChevronRight size={14} />}
                  </span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
