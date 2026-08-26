import { Tag, FileEdit, Search, Radio } from "lucide-react";

// Listing based alarms
export const LISTING_BASED_ALARMS = [
  {
    type: "price_change",
    label: "Fiyat Değişim Alarmı",
    description: "İlanın fiyatı düştüğünde veya değiştiğinde anında bildirim al.",
    icon: Tag,
    iconColor: "text-[#E8A33D]",
    badgeColor: "border-[#E8A33D]/30 bg-[#E8A33D]/10 text-[#E8A33D]",
  },
  {
    type: "favorite_updated",
    label: "İlan Güncelleme Alarmı",
    description: "İlan açıklaması veya detayları güncellendiğinde bildirim al.",
    icon: FileEdit,
    iconColor: "text-[#3B82F6]",
    badgeColor: "border-[#3B82F6]/30 bg-[#3B82F6]/10 text-[#3B82F6]",
  },
];

// Listing based alarm metadatas
export const ALARM_TYPE_METADATA = {
  price_change: {
    title: "Fiyat Takibi",
    icon: Tag,
    color: "border-[#E8A33D]/30 bg-[#E8A33D]/10 text-[#E8A33D]",
    iconColor: "text-[#E8A33D]",
  },
  favorite_updated: {
    title: "İlan Güncelleme",
    icon: FileEdit,
    color: "border-[#3B82F6]/30 bg-[#3B82F6]/10 text-[#3B82F6]",
    iconColor: "text-[#3B82F6]",
  },
  new_listing_check: {
    title: "Yeni İlan Arama",
    icon: Search,
    color: "border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981]",
    iconColor: "text-[#10B981]",
  },
};

export const getAlarmTypeMeta = (alarmType) => {
  return (
    ALARM_TYPE_METADATA[alarmType] || {
      title: "Alarm",
      icon: Radio,
      color: "border-[#232E3D] bg-[#161F2B] text-[#8B95A3]",
      iconColor: "text-[#8B95A3]",
    }
  );
};
