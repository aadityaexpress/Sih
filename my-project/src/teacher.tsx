import React, { useEffect, useState } from "react";

interface Student {
  id: number;
  name: string;
  rollNo: string;
  className: string;
  photoUrl: string;
  rgbData?: number[][][];
}

// Demo data (only used if no localStorage yet)
const demoStudents: Student[] = [
  {
    id: 1,
    name: "Aaditya Kumar",
    rollNo: "101",
    className: "12th-B",
    photoUrl: "faces/Aaditya_kumar.jpg",
  },
  {
    id: 2,
    name: "Ashri Singh",
    rollNo: "102",
    className: "12th-B",
    photoUrl: "faces/Ashri_singh.jpg",
  },
  {
    id: 3,
    name: "Shilpi",
    rollNo: "103",
    className: "12th-B",
    photoUrl: "faces/Shilpi.jpg",
  },
  {
    id: 4,
    name: "Rohan Verma",
    rollNo: "104",
    className: "12th-B",
    photoUrl: "faces/rohan_verma.jpg",
  },
];

// Convert image into RGB array
async function fetchImageRGB(path: string): Promise<number[][][]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = path;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject("Canvas not supported");

      ctx.drawImage(img, 0, 0);
      const { data, width, height } = ctx.getImageData(0, 0, img.width, img.height);

      const rgb: number[][][] = [];
      for (let y = 0; y < height; y++) {
        const row: number[][] = [];
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          row.push([data[idx], data[idx + 1], data[idx + 2]]);
        }
        rgb.push(row);
      }
      resolve(rgb);
    };

    img.onerror = reject;
  });
}

export default function TeacherDashboard() {
  const [students, setStudents] = useState<Student[]>(() => {
    const raw = localStorage.getItem("students");
    return raw ? JSON.parse(raw) : demoStudents;
  });

  const [newName, setNewName] = useState("");
  const [newRoll, setNewRoll] = useState("");
  const [newClass, setNewClass] = useState("");
  const [newPhoto, setNewPhoto] = useState("");

  // Save to localStorage whenever students change
  useEffect(() => {
    localStorage.setItem("students", JSON.stringify(students));
  }, [students]);

  // Load RGB data lazily
  useEffect(() => {
    students.forEach(async (s) => {
      if (!s.rgbData) {
        try {
          const rgb = await fetchImageRGB(s.photoUrl);
          setStudents((prev) =>
            prev.map((st) =>
              st.id === s.id ? { ...st, rgbData: rgb } : st
            )
          );
        } catch (err) {
          console.error("Failed to load RGB for", s.name, err);
        }
      }
    });
  }, [students]);

  function addStudent() {
    if (!newName || !newRoll || !newClass || !newPhoto) {
      alert("Please fill all fields and photo URL");
      return;
    }

    const newStudent: Student = {
      id: Date.now(),
      name: newName,
      rollNo: newRoll,
      className: newClass,
      photoUrl: newPhoto,
    };

    setStudents((prev) => [...prev, newStudent]);

    setNewName("");
    setNewRoll("");
    setNewClass("");
    setNewPhoto("");
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Teacher Dashboard</h1>

      {/* Add new student form */}
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="font-semibold mb-2">Add New Student</h2>
        <input
          type="text"
          placeholder="Name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="border p-2 mr-2"
        />
        <input
          type="text"
          placeholder="Roll No"
          value={newRoll}
          onChange={(e) => setNewRoll(e.target.value)}
          className="border p-2 mr-2"
        />
        <input
          type="text"
          placeholder="Class"
          value={newClass}
          onChange={(e) => setNewClass(e.target.value)}
          className="border p-2 mr-2"
        />
        <input
          type="text"
          placeholder="Photo URL (e.g. /faces/new.jpg)"
          value={newPhoto}
          onChange={(e) => setNewPhoto(e.target.value)}
          className="border p-2 mr-2"
        />
        <button
          onClick={addStudent}
          className="px-4 py-2 bg-green-500 text-white rounded-lg"
        >
          Add Student
        </button>
      </div>

      {/* Student table */}
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2 border">Photo</th>
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Roll No</th>
            <th className="p-2 border">Class</th>
            <th className="p-2 border">RGB Loaded?</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.id} className="text-center">
              <td className="p-2 border">
                <img
                  src={s.photoUrl}
                  alt={s.name}
                  className="w-16 h-16 object-cover rounded-full mx-auto"
                />
              </td>
              <td className="p-2 border">{s.name}</td>
              <td className="p-2 border">{s.rollNo}</td>
              <td className="p-2 border">{s.className}</td>
              <td className="p-2 border">
                {s.rgbData ? "✅ Yes" : "⏳ Loading..."}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-lg"
        onClick={() => (window.location.href = "/attendance")}
      >
        Go to Attendance System
      </button>
    </div>
  );
}
