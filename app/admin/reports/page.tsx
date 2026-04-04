"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Trash2, ShieldAlert } from "lucide-react";

interface Report {
  _id: string;
  reporterId: { _id: string; name: string; email: string; avatar?: string };
  reportedId: string;
  reportedProfile?: { id: string; name: string; avatar?: string; email?: string };
  reason: string;
  status: "pending" | "reviewed" | "resolved";
  createdAt: string;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchReports = async (pageNumber = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/reports?page=${pageNumber}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      setReports(data.reports);
      setTotalPages(data.pagination.pages);
      setPage(data.pagination.page);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error("Failed to update status");
      
      toast.success("Status updated");
      setReports(reports.map(r => r._id === id ? { ...r, status: newStatus as any } : r));
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const deleteReport = async (id: string) => {
    if (!confirm("Are you sure you want to delete this report?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to delete report");
      
      toast.success("Report deleted");
      setReports(reports.filter(r => r._id !== id));
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading && page === 1) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-red-500" />
          User Reports
        </h1>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-sm border border-zinc-200 dark:border-zinc-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-6 py-4 text-sm font-semibold text-zinc-600 dark:text-zinc-300">Reporter</th>
                <th className="px-6 py-4 text-sm font-semibold text-zinc-600 dark:text-zinc-300">Reported User</th>
                <th className="px-6 py-4 text-sm font-semibold text-zinc-600 dark:text-zinc-300">Reason</th>
                <th className="px-6 py-4 text-sm font-semibold text-zinc-600 dark:text-zinc-300">Date</th>
                <th className="px-6 py-4 text-sm font-semibold text-zinc-600 dark:text-zinc-300">Status</th>
                <th className="px-6 py-4 text-sm font-semibold text-zinc-600 dark:text-zinc-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-zinc-500">
                    No reports found.
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                          {report.reporterId?.avatar ? (
                            <img src={report.reporterId.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-500 font-bold">
                              {report.reporterId?.name?.charAt(0) || '?'}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-zinc-900 dark:text-white">
                            {report.reporterId?.name || 'Unknown'}
                          </div>
                          <div className="text-xs text-zinc-500">{report.reporterId?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                          {report.reportedProfile?.avatar ? (
                            <img src={report.reportedProfile.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-500 font-bold uppercase">
                              {report.reportedProfile?.name ? report.reportedProfile.name.charAt(0) : '?'}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-zinc-900 dark:text-white">
                            {report.reportedProfile?.name || 'Unknown'}
                          </div>
                          {report.reportedProfile?.email ? (
                            <div className="text-xs text-zinc-500">{report.reportedProfile.email}</div>
                          ) : (
                            <div className="text-[10px] text-zinc-500 font-mono">
                              {report.reportedId}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-900 dark:text-white max-w-xs break-words">
                      {report.reason}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500 whitespace-nowrap">
                      {new Date(report.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={report.status}
                        onChange={(e) => updateStatus(report._id, e.target.value)}
                        className={`text-xs font-semibold rounded-full px-3 py-1 outline-none cursor-pointer appearance-none ${
                          report.status === "pending"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                            : report.status === "reviewed"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => deleteReport(report._id)}
                        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                        title="Delete Report"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => fetchReports(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 disabled:opacity-50 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm font-medium text-zinc-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => fetchReports(page + 1)}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 disabled:opacity-50 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
