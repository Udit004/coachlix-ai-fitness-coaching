"use client";
import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import DeleteModal from "../../components/DeleteModal";

const CreatePlanModal = dynamic(() => import("./CreatePlanModal"), {
  loading: () => (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-[90%] max-w-xl bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg">
        <div className="space-y-4 animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mt-6"></div>
        </div>
      </div>
    </div>
  ),
  ssr: false,
});

const EditPlanModal = dynamic(() => import("./EditPlanModal"), {
  loading: () => (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-[90%] max-w-xl bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg">
        <div className="space-y-4 animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mt-6"></div>
        </div>
      </div>
    </div>
  ),
  ssr: false,
});

/**
 * DietPlanModals — Manage all diet plan modals (Create, Edit, Delete)
 */
export default function DietPlanModals({
  showCreateModal,
  onCreateModalClose,
  onCreatePlan,
  isCreating,
  editingPlan,
  onEditModalClose,
  onEditSave,
  isUpdating,
  showDeleteModal,
  deletingPlanId,
  deletingPlanName,
  onDeleteModalClose,
  onDeleteConfirm,
  isDeleting,
}) {
  return (
    <>
      {/* Create Plan Modal */}
      {showCreateModal && (
        <CreatePlanModal
          onClose={onCreateModalClose}
          onCreate={onCreatePlan}
          isCreating={isCreating}
        />
      )}

      {/* Edit Plan Modal */}
      {editingPlan && (
        <EditPlanModal
          plan={editingPlan}
          onClose={onEditModalClose}
          onSave={onEditSave}
        />
      )}

      {/* Delete Plan Modal */}
      {deletingPlanId && (
        <DeleteModal
          isOpen={showDeleteModal}
          onClose={onDeleteModalClose}
          onConfirm={onDeleteConfirm}
          title="Delete Diet Plan"
          description="Are you sure you want to delete this diet plan? This action cannot be undone."
          itemName={deletingPlanName}
          isLoading={isDeleting}
        />
      )}
    </>
  );
}
