import React, { useState } from 'react';
import { Room } from '../types/campus';
import {
  X,
  MapPin,
  Building,
  Navigation,
  Compass,
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';

interface CampusMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  onSelectRoom: (roomId: string) => void;
}

export const CampusMapModal: React.FC<CampusMapModalProps> = ({
  isOpen,
  onClose,
  rooms,
  onSelectRoom,
}) => {
  const [selectedFloor, setSelectedFloor] = useState<'Ground Floor' | '1st Floor' | '2nd Floor'>('1st Floor');

  if (!isOpen) return null;

  const ietFloorRooms = rooms.filter(
    (r) => r.building === 'IET' && r.floor === selectedFloor
  );

  const deekshaFloorRooms = rooms.filter(
    (r) => r.building === 'Deeksha Bhawan' && r.floor === selectedFloor
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
                Interactive Campus Blueprint & Floor Map
              </div>
              <h2 className="text-base sm:text-lg font-bold">
                DDUGU IET & Deeksha Bhawan Complex
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Floor Selection Tabs */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600 uppercase text-[11px] tracking-wider">
              Level:
            </span>
            {(['Ground Floor', '1st Floor', '2nd Floor'] as const).map((floor) => (
              <button
                key={floor}
                onClick={() => setSelectedFloor(floor)}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  selectedFloor === floor
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {floor}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
            <Compass className="w-3.5 h-3.5 text-blue-600" />
            <span>Connecting Walkway: 100 metres (~3 min walk)</span>
          </div>
        </div>

        {/* Map Blueprint Canvas */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* IET Building Schematic */}
            <div className="md:col-span-7 bg-slate-50 border-2 border-dashed border-blue-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-blue-700" />
                  <span className="font-bold text-sm text-slate-900">
                    IET Main Building ({selectedFloor})
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                  Engineering Hub
                </span>
              </div>

              {/* Schematic Grid of Rooms on this floor */}
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5 pt-1">
                {ietFloorRooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => {
                      onSelectRoom(room.id);
                      onClose();
                    }}
                    className="p-3 rounded-lg border border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/50 transition-all text-left group shadow-2xs cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-blue-900 group-hover:text-blue-700">
                        {room.code}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {room.capacity} seats
                      </span>
                    </div>
                    <div className="text-[11px] font-medium text-slate-700 line-clamp-1 mt-0.5">
                      {room.name}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                      <span>{room.type}</span>
                      <span className="text-blue-600 font-semibold group-hover:underline">
                        Book Room →
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Connecting Pathway Visual Indicator */}
            <div className="md:col-span-5 flex flex-col justify-between space-y-4">
              {/* Deeksha Bhawan Block */}
              <div className="bg-purple-50/50 border-2 border-dashed border-purple-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-purple-700" />
                    <span className="font-bold text-sm text-slate-900">
                      Deeksha Bhawan ({selectedFloor})
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-semibold">
                    ~100m Overflow
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  {deekshaFloorRooms.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => {
                        onSelectRoom(room.id);
                        onClose();
                      }}
                      className="p-2.5 rounded-lg border border-slate-200 bg-white hover:border-purple-400 hover:bg-purple-50/50 transition-all text-left group shadow-2xs cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-purple-900 group-hover:text-purple-700">
                          {room.code}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {room.capacity} seats
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-600 line-clamp-1 mt-0.5">
                        Tiered Amphitheater
                      </div>
                      <div className="text-[10px] text-purple-600 font-semibold mt-1 group-hover:underline">
                        Book Slot →
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pathway Information */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>Pedestrian Walkway Guide</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Exit the IET East Porch across the central lawn. Deeksha Bhawan is directly visible across the paved quadrangle (approx. 100 metres).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Click on any room card to initiate an instant booking query for that hall.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            Close Map
          </button>
        </div>
      </div>
    </div>
  );
};
