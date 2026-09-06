import { getBusinessSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/admin/SettingsForm";

export default async function AdminSettingsPage() {
  const settings = await getBusinessSettings();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold text-brand-navy">Settings</h1>
      <SettingsForm
        initial={{
          businessName: settings.businessName,
          whatsappNumber: settings.whatsappNumber,
          instagramUrl: settings.instagramUrl ?? "",
          whishNumber: settings.whishNumber,
          businessEmail: settings.businessEmail ?? "",
          adminNotifyEmail: settings.adminNotifyEmail ?? "",
          productionDays: settings.productionDays,
          photoRetentionHours: settings.photoRetentionHours,
          tempUploadRetentionHours: settings.tempUploadRetentionHours,
        }}
      />
    </div>
  );
}
