import { mockSectors } from "@/lib/mock-data";
import SectionLabel from "@/components/ui/SectionLabel";
import SectionTitle from "@/components/ui/SectionTitle";
import Divider from "@/components/ui/Divider";

export default function SectorGrid() {
  return (
    <section className="bg-page-bg py-24">
      <div className="max-w-[75rem] mx-auto px-8">
        <SectionLabel>What We Represent</SectionLabel>
        <SectionTitle>Industry Sectors</SectionTitle>
        <Divider className="mt-4" />

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {mockSectors.map((sector) => (
            <div
              key={sector._id}
              className="group border border-ivory-200 rounded-lg p-6 hover:bg-brand hover:border-brand transition-all duration-300 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-md bg-navy-100 group-hover:bg-white/20 flex items-center justify-center text-brand group-hover:text-white transition-all">
                <span className="text-sm font-medium">
                  {sector.icon?.charAt(0) ?? "●"}
                </span>
              </div>
              <span className="font-label text-label tracking-label uppercase text-brand group-hover:text-white mt-4 block">
                {sector.name}
              </span>
              <p className="text-caption text-mid group-hover:text-white/70 mt-2">
                {sector.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
