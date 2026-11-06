import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { deviceKeys } from '@/features/devices/api/deviceKeys';
import {
  assignDevice,
  createDevices,
  deleteDevice,
  transitionDevice,
  updateDevice,
} from '@/features/devices/api/devicesApi';

// Any device change can move the stats and the per-employee lists, so all device queries are refreshed.
const useDeviceMutation = <TVariables, TData>(mutationFn: (variables: TVariables) => Promise<TData>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: deviceKeys.all }),
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

export const useCreateDevices = () => useDeviceMutation(createDevices);
export const useUpdateDevice = () => useDeviceMutation(updateDevice);
export const useDeleteDevice = () => useDeviceMutation(deleteDevice);
export const useAssignDevice = () => useDeviceMutation(assignDevice);
export const useTransitionDevice = () => useDeviceMutation(transitionDevice);
