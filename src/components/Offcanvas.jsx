import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Offcanvas({ isOpen, onClose, width = 420, children, title }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-40">
          <motion.div
            className="absolute inset-0 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="absolute right-0 top-0 h-full bg-white shadow-lg overflow-auto"
            style={{ width }}
            initial={{ x: width }}
            animate={{ x: 0 }}
            exit={{ x: width }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">{title}</h3>
              <button onClick={onClose} className="px-2 py-1 bg-gray-100 rounded">Close</button>
            </div>
            <div className="p-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
