import toast from 'react-hot-toast';

/**
 * Custom hook for displaying toast notifications
 * Position: bottom-right (configured globally in ToastProvider)
 *
 * @example
 * const { success, error, loading } = useToast();
 *
 * // Success notification
 * success('Workout saved successfully!');
 *
 * // Error notification
 * error('Failed to save workout');
 *
 * // Loading notification
 * const toastId = loading('Saving...');
 * // Later update or dismiss
 * toast.dismiss(toastId);
 *
 * // Custom notification
 * notify('Custom message', { duration: 5000 });
 */
export const useToast = () => {
  return {
    /**
     * Show a success toast notification
     * @param {string} message - The message to display
     * @param {object} options - Toast options (duration, etc.)
     */
    success: (message, options = {}) =>
      toast.success(message, {
        duration: 3000,
        ...options,
      }),

    /**
     * Show an error toast notification
     * @param {string} message - The message to display
     * @param {object} options - Toast options
     */
    error: (message, options = {}) =>
      toast.error(message, {
        duration: 4000,
        ...options,
      }),

    /**
     * Show a loading toast notification
     * @param {string} message - The message to display
     * @param {object} options - Toast options
     * @returns {string} - Toast ID for later dismissal
     */
    loading: (message, options = {}) =>
      toast.loading(message, {
        duration: Infinity,
        ...options,
      }),

    /**
     * Show a custom toast notification
     * @param {string} message - The message to display
     * @param {object} options - Toast options
     */
    notify: (message, options = {}) =>
      toast(message, {
        duration: 4000,
        ...options,
      }),

    /**
     * Dismiss a specific toast or all toasts
     * @param {string} toastId - Optional toast ID to dismiss, if not provided all toasts are dismissed
     */
    dismiss: (toastId) => {
      if (toastId) {
        toast.dismiss(toastId);
      } else {
        toast.dismiss();
      }
    },
  };
};

export default useToast;
