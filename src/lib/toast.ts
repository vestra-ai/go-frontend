import { toast } from "sonner";

/** Shows the navy Go toast pill (styling and timing live on <Toaster>). */
export function toastGo(text: string) {
  return toast(text);
}
