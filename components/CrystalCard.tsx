import React from 'react';
import { Crystal } from '../types';
import { Tag, ExternalLink, Trash2, Calendar } from 'lucide-react';

interface CrystalCardProps {
  crystal: Crystal;
  onDelete: (id: string) => void;
}

export const CrystalCard: React.FC<CrystalCardProps> = ({ crystal, onDelete }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 p-6 flex flex-col h-full group relative overflow-hidden">
      {/* Decorative Top Border */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-300 to-brand-500"></div>

      <div className="flex justify-between items-start mb-3">
        <span className="px-2 py-1 bg-brand-50 dark:bg-slate-700 text-brand-700 dark:text-brand-300 text-xs font-semibold rounded-md uppercase tracking-wider border border-brand-100 dark:border-slate-600">
          {crystal.category}
        </span>
        <button 
          onClick={() => onDelete(crystal.id)}
          className="text-gray-300 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          title="Delete Crystal"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 leading-tight">
        {crystal.title}
      </h3>

      <p className="text-gray-600 dark:text-slate-300 text-sm mb-4 flex-grow leading-relaxed">
        {crystal.content}
      </p>

      <div className="mt-auto space-y-3">
        <div className="flex flex-wrap gap-2">
          {crystal.keywords.map((kw, idx) => (
            <span key={idx} className="inline-flex items-center text-xs text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-700 px-2 py-1 rounded-md">
              <Tag size={10} className="mr-1 text-brand-400" />
              {kw}
            </span>
          ))}
        </div>

        <div className="pt-3 border-t border-gray-50 dark:border-slate-700 flex justify-between items-center text-xs text-gray-400 dark:text-slate-500">
          <div className="flex items-center">
            <Calendar size={12} className="mr-1" />
            {new Date(crystal.createdAt).toLocaleDateString()}
          </div>
          {crystal.sourceUrl && (
            <a 
              href={crystal.sourceUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            >
              Source <ExternalLink size={12} className="ml-1" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};