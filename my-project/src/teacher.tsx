import React, { useEffect, useState, ChangeEvent } from "react";

// Teacher Dashboard (teacher.tsx)
// Revised to avoid any server / Node.js built-ins (like `fs`) being pulled into the browser bundle.
// - No external UI libraries imported (no @/components, lucide-react, next/router)
// - Uses only browser-safe APIs and React hooks
// - Features: Add/Delete Classes, Add/Edit/Delete Students (with image upload + preview),
//   Redirect to attendance page via window.location
// - Persistence: localStorage (browser)

interface Student {
  id: number;
  name: string;
  rollNo: string;
  className: string;
  photo: string | null; // data URL
}

export default function TeacherDashboard(): JSX.Element {
  const [classes, setClasses] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem("td_classes_v1");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const raw = localStorage.getItem("td_students_v1");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [classInput, setClassInput] = useState("");
  const [studentForm, setStudentForm] = useState<{
    name: string;
    rollNo: string;
    className: string;
    photo: string | null;
  }>({ name: "", rollNo: "", className: "", photo: null });

  // Persist to localStorage when lists change
  useEffect(() => {
    try {
      localStorage.setItem("td_classes_v1", JSON.stringify(classes));
    } catch (err) {
      console.warn("Failed to save classes:", err);
    }
  }, [classes]);

  useEffect(() => {
    try {
      localStorage.setItem("td_students_v1", JSON.stringify(students));
    } catch (err) {
      console.warn("Failed to save students:", err);
    }
  }, [students]);

  function handleAddClass() {
    const name = classInput.trim();
    if (!name) return;
    if (classes.some((c) => c.toLowerCase() === name.toLowerCase())) {
      alert("Class already exists");
      return;
    }
    setClasses((s) => [name, ...s]);
    setClassInput("");
  }

  function handleRemoveClass(cls: string) {
    if (!confirm(`Delete class "${cls}"? Students in this class will become unassigned.`)) return;
    setClasses((s) => s.filter((c) => c !== cls));
    setStudents((st) => st.map((x) => (x.className === cls ? { ...x, className: "" } : x)));
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setStudentForm((f) => ({ ...f, photo: null }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setStudentForm((f) => ({ ...f, photo: String(reader.result) }));
    };
    reader.onerror = () => {
      alert("Failed to read image file");
    };
    reader.readAsDataURL(file);
  }

  function handleAddStudent() {
    const name = studentForm.name.trim();
    const roll = studentForm.rollNo.trim();
    const cls = studentForm.className.trim();
    if (!name || !roll) {
      alert("Student name and roll number are required");
      return;
    }
    const newStudent: Student = {
      id: Date.now(),
      name,
      rollNo: roll,
      className: cls,
      photo: studentForm.photo,
    };
    setStudents((s) => [newStudent, ...s]);
    setStudentForm({ name: "", rollNo: "", className: "", photo: null });
  }

  function handleRemoveStudent(id: number) {
    if (!confirm("Delete this student?")) return;
    setStudents((s) => s.filter((x) => x.id !== id));
  }

  function handleEditStudent(id: number) {
    const s = students.find((x) => x.id === id);
    if (!s) return;
    setStudentForm({ name: s.name, rollNo: s.rollNo, className: s.className, photo: s.photo });
    // remove student being edited (we'll re-add on save)
    setStudents((arr) => arr.filter((x) => x.id !== id));
  }

  function goToAttendance() {
    // simple client-side redirect; avoids importing router libraries that might pull server deps
    window.location.href = "/attendance";
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="max-w-5xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Teacher's Dashboard</h1>
          <div>
            <button
              onClick={goToAttendance}
              className="px-3 py-2 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700"
            >
              Mark Attendance (Face Recognition)
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2">Manage classes and students. Photos are stored in browser storage for demo purposes.</p>
      </header>

      <main className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Classes */}
        <section className="col-span-1 bg-white p-4 rounded shadow">
          <h2 className="font-medium mb-3">Classes</h2>
          <div className="flex gap-2">
            <input
              value={classInput}
              onChange={(e) => setClassInput(e.target.value)}
              placeholder="e.g. 3A, Thermo Group"
              className="flex-1 border px-3 py-2 rounded"
            />
            <button onClick={handleAddClass} className="px-3 py-2 bg-green-600 text-white rounded">Add</button>
          </div>

          <ul className="mt-3 space-y-2">
            {classes.length === 0 && <li className="text-sm text-gray-500">No classes yet.</li>}
            {classes.map((c) => (
              <li key={c} className="flex items-center justify-between border px-3 py-2 rounded">
                <span>{c}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setClassInput(c)}
                    className="text-sm px-2 py-1 border rounded text-gray-700"
                  >
                    Load
                  </button>
                  <button onClick={() => handleRemoveClass(c)} className="text-sm px-2 py-1 bg-red-500 text-white rounded">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Student Form + List */}
        <section className="lg:col-span-2 bg-white p-4 rounded shadow">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Add / Edit Student</h2>
            <small className="text-xs text-gray-500">Photos recommended: frontal face for recognition</small>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-2">
              <div>
                <label className="text-sm">Name</label>
                <input value={studentForm.name} onChange={(e) => setStudentForm((f) => ({ ...f, name: e.target.value }))} className="w-full border px-3 py-2 rounded mt-1" placeholder="Student full name" />
              </div>

              <div>
                <label className="text-sm">Roll Number</label>
                <input value={studentForm.rollNo} onChange={(e) => setStudentForm((f) => ({ ...f, rollNo: e.target.value }))} className="w-full border px-3 py-2 rounded mt-1" placeholder="Roll number" />
              </div>

              <div>
                <label className="text-sm">Class</label>
                <select value={studentForm.className} onChange={(e) => setStudentForm((f) => ({ ...f, className: e.target.value }))} className="w-full border px-3 py-2 rounded mt-1">
                  <option value="">-- Select class --</option>
                  {classes.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 mt-2">
                <button onClick={handleAddStudent} className="px-4 py-2 bg-blue-600 text-white rounded">Add / Save</button>
                <button onClick={() => setStudentForm({ name: "", rollNo: "", className: "", photo: null })} className="px-4 py-2 border rounded">Reset</button>
              </div>
            </div>

            <div className="flex flex-col items-center justify-start border rounded p-3">
              <label className="text-sm mb-2">Photo</label>
              <div className="w-40 h-40 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                {studentForm.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={studentForm.photo} alt="preview" className="object-cover w-full h-full" />
                ) : (
                  <div className="text-xs text-gray-500 p-3 text-center">No photo selected</div>
                )}
              </div>

              <input type="file" accept="image/*" onChange={handleFileChange} className="mt-3 text-xs" />
              <p className="text-xs text-gray-500 mt-2">Tip: Use clear face photos (frontal) for better face recognition later.</p>
            </div>
          </div>

          {/* Student List */}
          <div className="mt-6">
            <h3 className="font-medium">Students</h3>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              {students.length === 0 && <div className="text-sm text-gray-500">No students yet.</div>}
              {students.map((st) => (
                <div key={st.id} className="flex items-center gap-3 border rounded p-3 bg-gray-50">
                  <div className="w-20 h-20 bg-white rounded overflow-hidden flex items-center justify-center">
                    {st.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={st.photo} alt={st.name} className="object-cover w-full h-full" />
                    ) : (
                      <div className="text-xs text-gray-500 text-center px-2">No Photo</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">{st.name}</div>
                        <div className="text-xs text-gray-600">Roll: {st.rollNo}</div>
                        <div className="text-xs text-gray-600">Class: {st.className || "— unassigned"}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button onClick={() => handleEditStudent(st.id)} className="px-2 py-1 border rounded text-sm">Edit</button>
                    <button onClick={() => handleRemoveStudent(st.id)} className="px-2 py-1 bg-red-500 text-white rounded text-sm">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="max-w-5xl mx-auto mt-6 text-xs text-gray-500">Tip: This demo stores images in localStorage (encoded as data URLs) for convenience. In production, upload images to a server or object storage and store references instead.</footer>
    </div>
  );
}
