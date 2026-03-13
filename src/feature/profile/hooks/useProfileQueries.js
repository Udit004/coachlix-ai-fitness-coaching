import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { userProfileService } from "@/feature/profile/services/userProfileService";

export const profileKeys = {
  all: ["profile"],
  details: () => [...profileKeys.all, "detail"],
  detail: (uid) => [...profileKeys.details(), uid],
};

export const useUserProfile = () => {
  const { user, loading } = useAuth();

  return useQuery({
    queryKey: profileKeys.detail(user?.uid || "anonymous"),
    queryFn: () => userProfileService.getUserProfile(user.uid),
    enabled: !!user && !loading,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (updates) => userProfileService.updateUserProfile(user?.uid, updates),
    onSuccess: (updatedProfile) => {
      if (!user?.uid) return;
      queryClient.setQueryData(profileKeys.detail(user.uid), updatedProfile);
    },
  });
};

export const useUploadProfileImage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (imageFile) => userProfileService.uploadProfileImage(user?.uid, imageFile),
    onSuccess: (imageUrl) => {
      if (!user?.uid) return;
      queryClient.setQueryData(profileKeys.detail(user.uid), (prev) =>
        prev ? { ...prev, profileImage: imageUrl } : prev
      );
    },
  });
};
