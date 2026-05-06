import { motion } from 'framer-motion';
import { Edit, Trash2, Eye } from 'lucide-react';
import AISpinner from './AISpinner';

const DataTable = ({ columns, data, isLoading, onEdit, onDelete, onDetail }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="min-w-full table-auto border-collapse">
        <thead>
          <tr className="bg-white/5 border-b border-white/10">
            {columns.map((col, index) => (
              <th 
                key={index} 
                className="px-6 py-3 text-left text-xs font-orbitron font-bold text-text-muted uppercase tracking-wider"
              >
                {col.header}
              </th>
            ))}
            {(onEdit || onDelete || onDetail) && (
              <th className="px-6 py-3 text-right text-xs font-orbitron font-bold text-text-muted uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <motion.tbody
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="divide-y divide-white/5"
        >
          {isLoading ? (
            <tr>
              <td colSpan={columns.length + (onEdit || onDelete || onDetail ? 1 : 0)} className="text-center py-12">
                <AISpinner size="sm" />
                <p className="mt-4 text-text-muted text-xs font-orbitron uppercase tracking-widest">Loading data...</p>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (onEdit || onDelete || onDetail ? 1 : 0)} className="text-center py-12 text-text-muted italic">
                No data available.
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <motion.tr
                key={row.id || rowIndex}
                variants={itemVariants}
                className="hover:bg-white/5 transition-colors duration-200 group"
              >
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {col.render ? col.render(row) : row[col.accessor]}
                  </td>
                ))}
                {(onEdit || onDelete || onDetail) && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      {onDetail && (
                        <button onClick={() => onDetail(row)} className="text-cyan-DEFAULT hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
                          <Eye size={16} />
                        </button>
                      )}
                      {onEdit && (
                        <button onClick={() => onEdit(row)} className="text-violet hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
                          <Edit size={16} />
                        </button>
                      )}
                      {onDelete && (
                        <button onClick={() => onDelete(row)} className="text-danger hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </motion.tr>
            ))
          )}
        </motion.tbody>
      </table>
    </div>
  );
};

export default DataTable;