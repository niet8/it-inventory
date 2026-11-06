import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { deviceKeys } from '@/features/devices/api/deviceKeys';
import { createEmployee, deleteEmployee, employeeKeys, updateEmployee } from '@/features/employees/api/employeesApi';

const showError = (error: Error) => {
  toast.error(error.message);
};

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEmployee,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: employeeKeys.all }),
    onError: showError,
  });
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateEmployee,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: employeeKeys.all }),
    onError: showError,
  });
};

// Deleting an employee frees their devices, so device lists and stats change too.
export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: employeeKeys.all }),
        queryClient.invalidateQueries({ queryKey: deviceKeys.all }),
      ]),
    onError: showError,
  });
};
