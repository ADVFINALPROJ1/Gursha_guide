import { useEffect, useState } from "react";
import API from "../services/api";

function RatingStars({ rating }) {
  const ratingNumber = Number(rating || 0);

  return (
    <span
      className="inline-flex items-center gap-1"
      aria-label={`${ratingNumber.toFixed(1)} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star <= ratingNumber ? "text-amber-400" : "text-gray-300"}
        >
          ★
        </span>
      ))}
    </span>
  );
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [workingReportId, setWorkingReportId] = useState(null);
  const token = sessionStorage.getItem("token");

  async function getReports() {
    try {
      const response = await API.get("/reports");
      setReports(response.data);
    } catch {
      setError("Could not load reported reviews. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      getReports();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  async function deleteReportedReview(reportId) {
    const shouldDelete = window.confirm("Delete this reported review?");

    if (!shouldDelete) {
      return;
    }

    setMessage("");
    setActionError("");
    setWorkingReportId(reportId);

    try {
      await API.delete(`/reports/${reportId}/review`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setReports((currentReports) =>
        currentReports.filter((report) => report.id !== reportId)
      );
      setMessage("Reported review deleted successfully.");
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
          "Could not delete reported review. Please try again."
      );
    } finally {
      setWorkingReportId(null);
    }
  }

  async function suspendReviewer(reportId, duration) {
    const durationLabel = duration === "forever" ? "forever" : `${duration} days`;
    const shouldSuspend = window.confirm(`Suspend this reviewer for ${durationLabel}?`);

    if (!shouldSuspend) {
      return;
    }

    setMessage("");
    setActionError("");
    setWorkingReportId(reportId);

    try {
      await API.post(
        `/reports/${reportId}/suspend`,
        {
          duration,
          reason: "Reported review moderation",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessage("Reviewer suspended successfully.");
      getReports();
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
          "Could not suspend reviewer. Please try again."
      );
    } finally {
      setWorkingReportId(null);
    }
  }

  return (
    <main className="p-6">
      <section className="mx-auto max-w-5xl rounded-lg bg-white p-6 shadow">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Reported Reviews
          </h1>
          <p className="mt-2 text-gray-600">
            Review reports submitted by GurshaGuide users.
          </p>
        </div>

        {loading && (
          <p className="rounded bg-gray-50 p-4 text-gray-600">
            Loading reports...
          </p>
        )}

        {error && (
          <p className="rounded bg-red-100 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {message && (
          <p className="mb-4 rounded bg-green-100 p-3 text-sm text-green-700">
            {message}
          </p>
        )}

        {actionError && (
          <p className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">
            {actionError}
          </p>
        )}

        {!loading && !error && reports.length === 0 && (
          <p className="rounded border border-dashed border-gray-300 bg-gray-50 p-6 text-center font-medium text-gray-600">
            No reports yet
          </p>
        )}

        {!loading && !error && reports.length > 0 && (
          <div className="grid gap-4">
            {reports.map((report) => {
              const reportDate = report.created_at
                ? new Date(report.created_at).toLocaleDateString()
                : "";
              const isWorking = workingReportId === report.id;

              return (
                <article
                  key={report.id}
                  className="rounded border border-gray-200 p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        {report.restaurant_name || "Unknown restaurant"}
                      </h2>
                      <p className="mt-1 text-sm text-gray-500">
                        Report #{report.id}
                        {reportDate ? ` • ${reportDate}` : ""}
                      </p>
                    </div>
                    <span className="rounded bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700">
                      {report.status || "pending"}
                    </span>
                  </div>

                  <div className="mt-4 rounded bg-red-50 p-3">
                    <p className="text-sm font-semibold text-red-700">
                      Report reason
                    </p>
                    <p className="mt-1 text-red-700">{report.reason}</p>
                  </div>

                  <div className="mt-4 rounded bg-gray-50 p-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-700">
                      <RatingStars rating={report.review_rating} />
                      {Number(report.review_rating || 0).toFixed(1)} / 5
                    </div>
                    <p className="mt-2 text-gray-700">
                      {report.review_comment || "Review comment unavailable."}
                    </p>
                    <p className="mt-2 text-sm text-gray-500">
                      Reviewer: {report.reviewer_name || "Anonymous user"}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => deleteReportedReview(report.id)}
                      disabled={isWorking || !report.review_id}
                      className="rounded border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:text-red-300"
                    >
                      Delete Review
                    </button>
                    <button
                      type="button"
                      onClick={() => suspendReviewer(report.id, "7")}
                      disabled={isWorking || !report.reviewer_id}
                      className="rounded border border-orange-200 px-3 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50 disabled:text-orange-300"
                    >
                      Suspend 7 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => suspendReviewer(report.id, "30")}
                      disabled={isWorking || !report.reviewer_id}
                      className="rounded border border-orange-200 px-3 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50 disabled:text-orange-300"
                    >
                      Suspend 30 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => suspendReviewer(report.id, "forever")}
                      disabled={isWorking || !report.reviewer_id}
                      className="rounded border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:text-gray-300"
                    >
                      Suspend Forever
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
