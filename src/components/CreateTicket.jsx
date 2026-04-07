import { useState, useEffect } from "react";
import { API_BASE_URL } from "../utils/constants";
import { CheckCircle2, User, X, Upload, FileImage, Plus, Loader2, ChevronRight, Ticket } from "lucide-react";
import toast from "react-hot-toast";

export default function CreateTicket({ user }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("internal");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const [studentCode, setStudentCode] = useState("");
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState(null);
  const [scholars, setScholars] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [scholar, setScholar] = useState("");
  const [project, setProject] = useState("");
  const [milestone, setMilestone] = useState("");
  const [fetchedMilestones, setFetchedMilestones] = useState([]);
  const [milestonesLoading, setMilestonesLoading] = useState(false);
  const [milestonesError, setMilestonesError] = useState(null);

  const fetchProjectsByStudentCode = async (code) => {
    if (!code) {
      setProjects([]);
      setProjectsError(null);
      return;
    }

    setProjectsLoading(true);
    setProjectsError(null);
    try {
      const res = await fetch(API_BASE_URL + '/fetchprojectsbystudentcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentCode: code }),
      });

      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();

      if (data.status) {
        setProjects(Array.isArray(data.projects) ? data.projects : []);
        setScholars(Array.isArray(data.scholars) ? data.scholars : []);

        if (Array.isArray(data.scholars) && data.scholars.length === 1) {
          setScholar(String(data.scholars[0].st_id));
        } else {
          setScholar("");
        }
      }
    } catch (err) {
      console.error(err);
      setProjectsError(err.message || 'Failed to fetch projects');
      setProjects([]);
    } finally {
      setProjectsLoading(false);
    }
  };

  const fetchMilestonesByProjectId = async (projectId) => {
    if (!projectId) {
      setFetchedMilestones([]);
      setMilestonesError(null);
      return;
    }

    setMilestonesLoading(true);
    setMilestonesError(null);
    try {
      const res = await fetch(API_BASE_URL + '/fetchmilestonesbyprojectid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });

      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();

      if (data.status && data.milestones && Array.isArray(data.milestones)) {
        setFetchedMilestones(data.milestones);
      }
    } catch (err) {
      console.error(err);
      setMilestonesError(err.message || 'Failed to fetch milestones');
      setFetchedMilestones([]);
    } finally {
      setMilestonesLoading(false);
    }
  };

  useEffect(() => {
    let timer;
    if (!open) {
      timer = setTimeout(() => {
        setType("internal");
        setDescription("");
        setFile(null);
        setPreview(null);
        if (user?.role === "scholar") {
          setStudentCode(user?.student_code || "");
        } else {
          setStudentCode("");
        }
        setProjects([]);
        setProjectsError(null);
        setProjectsLoading(false);
        setScholars([]);
        setProject("");
        setMilestone("");
      }, 300);
    }
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (open && user && user.role === "scholar") {
      const code = user.student_code || "";
      setStudentCode(code);
      setScholar(user);
      fetchProjectsByStudentCode(code);
      setType("external");
    }
  }, [user, open]);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onFileChange = (e) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const roleIsCrm = user?.role === "crm";
    const isExternal = roleIsCrm ? type === "external" : true;

    if (!description || description.trim() === "") {
      toast.error("Please provide a description.");
      return;
    }

    if (isExternal) {
      if (!studentCode || String(studentCode).trim() === "") {
        toast.error("Please enter a student code.");
        return;
      }
      if (!scholar && scholars.length > 1) {
        toast.error("Please select a scholar.");
        return;
      }
      if (!project) {
        toast.error("Please select a project.");
        return;
      }
      if (!milestone) {
        toast.error("Please select a milestone.");
        return;
      }
    }

    const ticket = {
      createdBy: (user?.id || user?.st_id) ?? "unknown",
      role: user?.role ?? null,
      type: roleIsCrm ? type : "external",
      description,
      fileName: file?.name ?? null,
      external: null,
      createdAt: new Date().toISOString(),
    };

    if (type == "external") {
      ticket.external = {
        studentCode,
        project,
        milestone,
        scholar,
        scholarName: (scholars.find((s) => String(s.st_id) === String(scholar))?.st_name ?? null),
      };
    }

    const formData = new FormData();
    formData.append("ticket", JSON.stringify(ticket));
    if (file) formData.append("file", file);

    setSubmitting(true);
    fetch(API_BASE_URL + "/createticket", {
      method: "POST",
      body: formData,
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok || (data && data.status === false)) {
          const msg = (data && data.message) || "Failed to create ticket";
          toast.error(msg);
          return;
        }
        toast.success((data && data.message) || "Ticket created successfully");
        setOpen(false);
      })
      .catch((err) => {
        console.error(err);
        toast.error(err?.message || "Network error while creating ticket");
      })
      .finally(() => setSubmitting(false));
  };

  const availableProjects = projects ?? [];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
      >
        <Plus size={16} />
        Create Ticket
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => setOpen(false)}
          />

          <div className={`fixed right-0 top-0 h-full bg-white shadow-2xl w-full max-w-2xl transform transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
            <form onSubmit={handleSubmit} className="relative h-full overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                    <Ticket size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Create New Ticket</h2>
                    <p className="text-sm text-slate-500">Submit a support request</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  <X size={16} className="text-slate-600" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                {/* Ticket Type Toggle (CRM only) */}
                {user?.role === "crm" && (
                  <div className="bg-slate-50 rounded-xl p-1 flex gap-1">
                    <button
                      type="button"
                      onClick={() => setType("internal")}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        type === "internal"
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      Internal Ticket
                    </button>
                    <button
                      type="button"
                      onClick={() => setType("external")}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        type === "external"
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      External Ticket
                    </button>
                  </div>
                )}

                {/* External Ticket Fields */}
                {(user?.role !== "crm" || type === "external") && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Student Code */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                          Student Code <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          className={`w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                            user?.role === "scholar" ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
                          }`}
                          placeholder="Enter student code"
                          value={studentCode}
                          disabled={user?.role === "scholar"}
                          onChange={(e) => {
                            const val = e.target.value;
                            setStudentCode(val);
                            setProject("");
                            setMilestone("");
                            fetchProjectsByStudentCode(val);
                          }}
                        />
                        {projectsLoading && (
                          <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                            <Loader2 size={14} className="animate-spin" />
                            Loading projects...
                          </div>
                        )}
                        {projectsError && (
                          <div className="text-sm text-red-500 mt-2">{projectsError}</div>
                        )}
                      </div>

                      {/* Scholar Selection */}
                      {scholars.length > 1 && (
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                            Scholar <span className="text-red-500">*</span>
                          </label>
                          <select
                            required
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={scholar}
                            onChange={(e) => {
                              const val = e.target.value;
                              setScholar(val);
                              setProject("");
                              setMilestone("");
                            }}
                          >
                            <option value="">Select scholar</option>
                            {scholars.map((s) => (
                              <option key={s.st_id} value={String(s.st_id)}>
                                {s.st_name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {scholars.length === 1 && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2">
                          <User size={16} className="text-emerald-600" />
                          <span className="text-sm font-medium text-emerald-700">{scholars[0].st_name}</span>
                          <CheckCircle2 size={14} className="text-emerald-500 ml-auto" />
                        </div>
                      )}

                      {/* Project */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                          Project <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                          value={project}
                          onChange={(e) => {
                            const val = e.target.value;
                            setProject(val);
                            setMilestone("");
                            setFetchedMilestones([]);
                            fetchMilestonesByProjectId(val);
                          }}
                          disabled={!scholar && scholars.length > 1}
                        >
                          <option value="">Select project</option>
                          {availableProjects.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.project_title}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Milestone */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                          Milestone <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                          value={milestone}
                          onChange={(e) => setMilestone(e.target.value)}
                          disabled={!project || milestonesLoading}
                        >
                          <option value="">Select milestone</option>
                          {fetchedMilestones && fetchedMilestones.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.segment_title}
                            </option>
                          ))}
                        </select>
                        {milestonesLoading && (
                          <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                            <Loader2 size={14} className="animate-spin" />
                            Loading milestones...
                          </div>
                        )}
                        {milestonesError && (
                          <div className="text-sm text-red-500 mt-2">{milestonesError}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    rows={4}
                    placeholder="Describe the issue or request in detail..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Attachment (optional)
                  </label>
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 hover:border-blue-300 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={onFileChange}
                      id="file-upload"
                      className="hidden"
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center cursor-pointer"
                    >
                      {!preview ? (
                        <>
                          <Upload size={32} className="text-slate-400 mb-2" />
                          <p className="text-sm text-slate-500">Click to upload or drag and drop</p>
                          <p className="text-xs text-slate-400 mt-1">PNG, JPG, GIF up to 10MB</p>
                        </>
                      ) : (
                        <div className="relative">
                          <img src={preview} alt="preview" className="max-h-48 rounded-lg shadow-md object-contain" />
                          <button
                            type="button"
                            onClick={() => { setFile(null); setPreview(null); }}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}
                      {file && !preview && (
                        <div className="flex items-center gap-2 mt-2">
                          <FileImage size={16} className="text-blue-500" />
                          <span className="text-sm text-slate-600">{file.name}</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <ChevronRight size={16} />
                      Create Ticket
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}