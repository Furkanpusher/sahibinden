import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Radio } from "lucide-react";
import { toast } from "sonner";
import CreateAlarmModal from "./CreateAlarmModal";

export default function CreateSearchAlarmButton({ category = "car", appliedFilters = {} }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleOpenModal = () => {
    const token =
      localStorage.getItem("access_token") || localStorage.getItem("access");

    if (!token) {
      toast.error("Alarm oluşturmak için lütfen önce giriş yapınız.");
      navigate("/login");
      return;
    }

    setIsModalOpen(true);
  };

  // Aktif filtre sayısını hesapla
  const activeFilterCount = Object.entries(appliedFilters).filter(
    ([k, v]) => v !== "" && v != null && k !== "page" && k !== "page_size"
  ).length;

  return (
    <>
      <button
        type="button"
        onClick={handleOpenModal}
        className="inline-flex items-center gap-2 rounded-lg border border-[#232E3D] bg-[#161F2B] px-3.5 py-2 text-sm font-semibold text-[#EDEFF2] hover:border-[#E8A33D]/60 hover:bg-[#1C2733] hover:text-[#E8A33D] transition-all shadow-sm"
        title="Alarm Oluştur"
      >
        <Radio size={16} className="text-[#E8A33D]" />
        <span>
          {activeFilterCount > 0
            ? `Alarm Kur (${activeFilterCount})`
            : "Alarm Kur"}
        </span>
      </button>

      {isModalOpen && (
        <CreateAlarmModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialCategory={category}
          initialFilters={appliedFilters}
          initialAlarmType="new_listing_check"
        />
      )}
    </>
  );
}

