// Simple toast utility for replacing sonner
// This provides backward compatibility for existing toast.success, toast.error syntax
import { customToast } from '@/lib/toast';

export const toast = {
  success: (message: string, options?: { description?: string }) => {
    return customToast.success(message, options?.description);
  },
  
  error: (message: string, options?: { description?: string }) => {
    return customToast.error(message, options?.description);
  },
  
  warning: (message: string, options?: { description?: string }) => {
    return customToast.warning(message, options?.description);
  },
  
  info: (message: string, options?: { description?: string }) => {
    return customToast.info(message, options?.description);
  },
  
  loading: (message: string, options?: { description?: string }) => {
    return customToast.loading(message, options?.description);
  },

  // Specialized types
  nostr: (message: string, options?: { description?: string }) => {
    return customToast.nostr(message, options?.description);
  },
  
  crypto: (message: string, options?: { description?: string }) => {
    return customToast.crypto(message, options?.description);
  },
  
  relay: (message: string, options?: { description?: string }) => {
    return customToast.relay(message, options?.description);
  },
  
  auth: (message: string, options?: { description?: string }) => {
    return customToast.auth(message, options?.description);
  },
  
  zap: (message: string, options?: { description?: string }) => {
    return customToast.zap(message, options?.description);
  },

  promise: customToast.promise,
  dismiss: customToast.dismiss,
  remove: customToast.remove,
};

export default toast; 