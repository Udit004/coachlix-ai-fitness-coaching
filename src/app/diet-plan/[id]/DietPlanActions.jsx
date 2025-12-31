"use client";
import React, { useState, useRef, useEffect } from "react";
import { Copy, Edit, Trash2, MoreVertical } from "lucide-react";
import { createPortal } from "react-dom";

export default function DietPlanActions({
  onClone,
  onEdit,
  onDelete,
  isCloning,
  isDeleting,
}) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const buttonRef = useRef(null);

  const toggleMobileMenu = () => {
    if (!showMobileMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
    setShowMobileMenu(!showMobileMenu);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMobileMenu && buttonRef.current && !buttonRef.current.contains(event.target)) {
        const dropdown = document.getElementById('diet-plan-actions-dropdown');
        if (dropdown && !dropdown.contains(event.target)) {
          setShowMobileMenu(false);
        }
      }
    };

    if (showMobileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMobileMenu]);

  const handleClone = () => {
    setShowMobileMenu(false);
    onClone();
  };

  const handleEdit = () => {
    setShowMobileMenu(false);
    onEdit();
  };

  const handleDelete = () => {
    setShowMobileMenu(false);
    onDelete();
  };

  return (
    <>
      {/* Desktop View - Show all buttons inline on large screens */}
      <div className="hidden lg:flex flex-row gap-2 sm:gap-3">
        <button
          onClick={onClone}
          disabled={isCloning}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 disabled:opacity-50 text-white rounded-lg transition-all text-sm"
        >
          <Copy className="h-4 w-4" />
          <span>{isCloning ? "Cloning..." : "Clone"}</span>
        </button>
        <button
          onClick={onEdit}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white rounded-lg transition-all text-sm"
        >
          <Edit className="h-4 w-4" />
          <span>Edit</span>
        </button>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors text-sm"
        >
          <Trash2 className="h-4 w-4" />
          <span>{isDeleting ? "Deleting..." : "Delete"}</span>
        </button>
      </div>

      {/* Mobile View - 3-dot menu */}
      <div className="lg:hidden relative">
        <button
          ref={buttonRef}
          onClick={toggleMobileMenu}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          aria-label="More actions"
        >
          <MoreVertical className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>

        {showMobileMenu && typeof window !== 'undefined' && createPortal(
          <div
            id="diet-plan-actions-dropdown"
            className="fixed w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-[9999]"
            style={{
              top: `${dropdownPosition.top}px`,
              right: `${dropdownPosition.right}px`,
            }}
          >
            <button
              onClick={handleClone}
              disabled={isCloning}
              className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              <Copy className="mr-3 h-4 w-4" />
              <span>{isCloning ? "Cloning..." : "Clone Plan"}</span>
            </button>
            <button
              onClick={handleEdit}
              className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Edit className="mr-3 h-4 w-4" />
              <span>Edit Plan</span>
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
            >
              <Trash2 className="mr-3 h-4 w-4" />
              <span>{isDeleting ? "Deleting..." : "Delete Plan"}</span>
            </button>
          </div>,
          document.body
        )}
      </div>
    </>
  );
}
