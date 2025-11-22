import React, { ReactNode } from 'react';

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h4 className="text-xl font-bold text-txt-primary py-1">
          <span className="text-txt-muted font-light">Page /</span> {title}
        </h4>
        {description && <p className="text-sm text-txt-secondary">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};