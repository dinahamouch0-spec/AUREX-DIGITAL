import { MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/whatsapp";
import { fillTemplate } from "@/lib/whatsapp-templates";

export function WhatsAppActions({
  phone,
  templates,
  vars,
}: {
  phone: string;
  templates: { key: string; label: string; body: string }[];
  vars: Record<string, string>;
}) {
  return (
    <div className="flex flex-col gap-2">
      <a
        href={whatsappLink(phone, "")}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-green-600 px-4 text-sm font-semibold text-white hover:bg-green-700"
      >
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        Contact on WhatsApp
      </a>
      <div className="flex flex-col gap-1.5">
        {templates.map((tpl) => (
          <a
            key={tpl.key}
            href={whatsappLink(phone, fillTemplate(tpl.body, vars))}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-brand-line px-3 py-2 text-xs font-semibold text-brand-navy hover:border-brand-pink hover:text-brand-pink-deep"
          >
            {tpl.label}
          </a>
        ))}
      </div>
    </div>
  );
}
