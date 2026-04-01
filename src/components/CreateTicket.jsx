import { useState, useEffect } from "react";
import { API_BASE_URL } from "../utils/constants";
import { CheckCircle2, User } from "lucide-react";
import toast from "react-hot-toast";

export default function CreateTicket({ user }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("internal");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  // Student code + projects fetched from API
  const [studentCode, setStudentCode] = useState("");
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState(null);
  const [scholars, setScholars] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // External-specific
  const [scholar, setScholar] = useState("");
  const [project, setProject] = useState("");
  const [milestone, setMilestone] = useState("");
  const [fetchedMilestones, setFetchedMilestones] = useState([]);
  const [milestonesLoading, setMilestonesLoading] = useState(false);
  const [milestonesError, setMilestonesError] = useState(null);




  // Fetch projects by student code from backend API
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

        // Auto-select when exactly one scholar, otherwise clear selection
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

  // Fetch milestones by project id from backend API
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
      // Delay clearing form until close animation completes
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
      }, 300); // matches CSS transition duration
    }

    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    // When the create-ticket panel opens and the current user is a scholar,
    // populate the student code and fetch their projects immediately.
    if (open && user && user.role === "scholar") {
      const code = user.student_code || "";
      setStudentCode(code);
      setScholar(user)
      fetchProjectsByStudentCode(code);
      setType("external")
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
    // Basic validation before sending
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


    if ( type == "external") {
      ticket.external = {
        studentCode,
        project,
        milestone,
        scholar,
        scholarName:
          (scholars.find((s) => String(s.st_id) === String(scholar))?.st_name ?? null),
      };
    }

    // Prepare FormData (for optional file upload)
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
        // Optionally reset form state
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
    <div>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-md mr-3 shadow-sm hover:bg-blue-700"
      >
        Create Ticket
      </button>
      {open && (

        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${open ? 'opacity-50 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setOpen(false)}
            aria-hidden
          />

          {/* Offcanvas panel (right side) */}
          <div className={`fixed right-0 top-0 h-full bg-white z-10 shadow-2xl w-full max-w-3xl transform transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`} aria-hidden={!open}>
            <form
              onSubmit={handleSubmit}
              className="relative h-full overflow-auto p-6"
              aria-modal="true"
              role="dialog"
            >
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-2xl font-semibold">Create Ticket</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close dialog"
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {(user?.role === "crm") && (
                <div className="mb-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setType("internal")}
                    className={`px-3 py-2 rounded-md border ${type === "internal" ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                  >
                    Internal
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("external")}
                    className={`px-3 py-2 rounded-md border ${type === "external" ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                  >
                    External
                  </button>
                </div>
              )}

              <div className="space-y-4">




                {(user?.role !== "crm" || type === "external") && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Student Code <span className="text-red-500">*</span></label>
                      <input
                        required
                        className={`border p-2 w-full rounded ${user?.role === "scholar" ? 'opacity-60 cursor-not-allowed' : ''}`}
                        placeholder="Enter student code"
                        value={studentCode}
                        disabled={user?.role == "scholar"} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setStudentCode(val);
                          setProject("");
                          setMilestone("");
                          fetchProjectsByStudentCode(val);
                        }}
                      />

                      {projectsLoading && <div className="text-sm text-gray-500 mt-2">Loading projects...</div>}
                      {projectsError && <div className="text-sm text-red-500 mt-2">{projectsError}</div>}
                    </div>

                    {/* Scholar selection: show select when multiple, auto-display when single */}


                    <div>
                      <label className="block text-sm font-medium mb-1">Project <span className="text-red-500">*</span></label>
                      <select
                        required
                        className={`border p-2 w-full rounded ${!scholar ? 'opacity-60 cursor-not-allowed' : ''}`}
                        value={project}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProject(val);
                          setMilestone("");
                          setFetchedMilestones([]);
                          fetchMilestonesByProjectId(val);
                        }}
                        disabled={!scholar}
                      >
                        <option value="">Select project</option>
                        {availableProjects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.project_title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Milestone <span className="text-red-500">*</span></label>
                      <select
                        required
                        className={`border p-2 w-full rounded ${!project ? 'opacity-60 cursor-not-allowed' : ''}`}
                        value={milestone}
                        onChange={(e) => setMilestone(e.target.value)}
                        disabled={!project || milestonesLoading}
                      >
                        <option value="">Select milestone</option>
                        {fetchedMilestones && fetchedMilestones.length > 0 && fetchedMilestones.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.segment_title}
                          </option>
                        ))}
                      </select>
                      {milestonesLoading && <div className="text-sm text-gray-500 mt-2">Loading milestones...</div>}
                      {milestonesError && <div className="text-sm text-red-500 mt-2">{milestonesError}</div>}
                    </div>
                  </div>
                )}

                {scholars.length > 1 && (
                  <div className="w-45">
                    <label className="block text-sm font-medium mb-1">Scholar <span className="text-red-500">*</span></label>
                    <select
                      required
                      className="border p-2 w-full rounded"
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
                  <div className="p-2  rounded ">
                    <div className="font-medium flex items-center"><User size={12} className="mr-1" />{scholars[0].st_name} <CheckCircle2 className="ml-2 text-green-500" /></div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">Description <span className="text-red-500">*</span></label>
                  <textarea
                    required
                    className="border p-3 w-full rounded min-h-[100px] placeholder-gray-400"
                    placeholder="Describe the issue or request..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Screenshot (optional)</label>
                  <div className="flex items-center gap-4">
                    <input type="file" accept="image/*" onChange={onFileChange} />
                    {file && <div className="text-sm text-gray-600">{file.name}</div>}
                  </div>

                  {preview && (
                    <div className="mt-3">
                      <img src={preview} alt="preview" className="max-h-44 w-auto rounded shadow-sm object-contain" />
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-md border text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-2 rounded-md bg-blue-600 text-white text-sm shadow ${submitting ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {submitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>

        </div>
      )}
    </div>
  );
}
