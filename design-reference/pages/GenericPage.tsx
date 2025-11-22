import React from 'react';
import { AdminPageHeader } from '../components/AdminPageHeader';

interface GenericPageProps {
  title: string;
}

export const GenericPage: React.FC<GenericPageProps> = ({ title }) => {
  return (
    <div>
      <AdminPageHeader 
        title={title} 
        action={
          <button className="bg-white border border-gray-300 text-txt-secondary px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
            <i className='bx bx-export mr-1'></i> Export
          </button>
        }
      />

      <div className="bg-white rounded-card shadow-card border border-gray-100 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-20 h-20 bg-primary-light rounded-full flex items-center justify-center mb-6">
          <i className='bx bx-layer text-4xl text-primary'></i>
        </div>
        <h3 className="text-xl font-bold text-txt-primary mb-2">Under Construction</h3>
        <p className="text-txt-muted max-w-md">
          The <span className="font-semibold text-primary">{title}</span> module is currently being updated to match the new design system.
        </p>
      </div>
    </div>
  );
};