import React, { useState } from 'react';
import { Announcement, UserProfile } from '../types/campus';
import { campusApi } from '../services/api';
import {
  BellRing,
  PlusCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Tag,
  Trash2,
  CheckCircle2,
  Building,
  Info
} from 'lucide-react';

interface AnnouncementsViewProps {
  announcements: Announcement[];
  currentUser: UserProfile;
  onRefresh: () => void;
}

export const AnnouncementsView: React.FC<AnnouncementsViewProps> = ({
  announcements,
  currentUser,
  onRefresh,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<Announcement['category']>('Room Relocation');
  const [priority, setPriority] = useState<Announcement['priority']>('Important');
  const [targetAudience, setTargetAudience] = useState<Announcement['targetAudience']>('All');
  const [affectedRoom, setAffectedRoom] = useState('');
  const [newRoom, setNewRoom] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = announcements.filter((a) => {
    if (filterCategory !== 'All' && a.category !== filterCategory) return false;
    return true;
  });

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    setIsSubmitting(true);
    try {
      await campusApi.createAnnouncement({
        title,
        content,
        author: currentUser.name,
        authorRole: currentUser.designation,
        category,
        priority,
        targetAudience,
        affectedRoom: affectedRoom || undefined,
        newRoom: newRoom || undefined,
      });

      setTitle('');
      setContent('');
      setAffectedRoom('');
      setNewRoom('');
      setIsCreating(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (window.confirm('Delete this campus announcement?')) {
      await campusApi.deleteAnnouncement(id);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-600 mb-1">
            <span>Official University Circulars</span>
            <span>·</span>
            <span className="text-slate-500 font-normal">DDUGU IET & Deeksha Bhawan</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Campus Announcements & Room Relocations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time updates regarding classroom shifts, examination seating, and facility notices
          </p>
        </div>

        {currentUser.role === 'admin' && (
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Publish Announcement</span>
          </button>
        )}
      </div>

      {/* Admin Broadcast Creation Form */}
      {isCreating && currentUser.role === 'admin' && (
        <form
          onSubmit={handleCreateAnnouncement}
          className="bg-white border border-blue-200 rounded-xl p-5 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Publish New Campus Circular
            </h3>
            <span className="text-xs text-blue-600 font-mono font-medium">Admin Authorization Active</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Announcement Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Room Reallocation: CS-302 Relocated to LH-04"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Announcement['category'])}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="Room Relocation">Room Relocation</option>
                <option value="Exam Notice">Exam Notice</option>
                <option value="Lab Schedule">Lab Schedule</option>
                <option value="General Notice">General Notice</option>
              </select>
            </div>
          </div>

          {category === 'Room Relocation' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-amber-50 p-3 rounded-lg border border-amber-200">
              <div>
                <label className="block text-xs font-semibold text-amber-950 mb-1">
                  Original Affected Room
                </label>
                <input
                  type="text"
                  value={affectedRoom}
                  onChange={(e) => setAffectedRoom(e.target.value)}
                  placeholder="e.g. IET17"
                  className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-md text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-950 mb-1">
                  New Relocated Room
                </label>
                <input
                  type="text"
                  value={newRoom}
                  onChange={(e) => setNewRoom(e.target.value)}
                  placeholder="e.g. Deeksha Bhawan LH04"
                  className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-md text-xs font-mono font-bold"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Announcement['priority'])}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="Normal">Normal</option>
                <option value="Important">Important</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Audience
              </label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value as Announcement['targetAudience'])}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="All">All Campus</option>
                <option value="Students">Students Only</option>
                <option value="Faculty">Faculty Only</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Circular Content & Instructions *
            </label>
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="State clear reason for venue change, student batch, timings, and instructor..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
            >
              {isSubmitting ? 'Broadcasting...' : 'Broadcast Announcement'}
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-lg w-fit text-xs">
        {['All', 'Room Relocation', 'Exam Notice', 'Lab Schedule', 'General Notice'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              filterCategory === cat
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className={`bg-white border rounded-xl p-5 shadow-xs transition-all ${
              item.priority === 'Urgent'
                ? 'border-amber-300 ring-1 ring-amber-100'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded ${
                      item.priority === 'Urgent'
                        ? 'bg-amber-100 text-amber-900 border border-amber-200'
                        : item.priority === 'Important'
                        ? 'bg-blue-100 text-blue-900'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {item.priority} · {item.category}
                  </span>

                  <span className="text-xs text-slate-400">·</span>

                  <span className="text-xs text-slate-500 font-mono">
                    Audience: <strong className="text-slate-700">{item.targetAudience}</strong>
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">
                  {item.title}
                </h3>
              </div>

              {currentUser.role === 'admin' && (
                <button
                  onClick={() => handleDeleteAnnouncement(item.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Delete announcement"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Relocation Visual Tag */}
            {item.affectedRoom && item.newRoom && (
              <div className="my-3 p-3 bg-slate-50 border border-slate-200 rounded-lg inline-flex items-center gap-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase font-mono">Original</span>
                  <span className="font-mono line-through font-semibold text-slate-500">{item.affectedRoom}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <span className="text-blue-600 text-[10px] block uppercase font-mono font-bold">New Assigned Venue</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{item.newRoom}</span>
                </div>
              </div>
            )}

            <p className="text-xs text-slate-700 mt-2 leading-relaxed">
              {item.content}
            </p>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800">{item.author}</span>
                <span>·</span>
                <span>{item.authorRole}</span>
              </div>
              <span className="font-mono text-[11px]">
                {new Date(item.createdAt).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <BellRing className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-900">No circulars in this category</h3>
            <p className="text-xs text-slate-500 mt-1">
              Select "All" to view all active campus announcements and room notices.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
