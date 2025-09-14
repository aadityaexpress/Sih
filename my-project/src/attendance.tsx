import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

export default function Attendance() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [attendance, setAttendance] = useState({});
  const [loadingMessage, setLoadingMessage] = useState("Initializing Webcam...");
  const [error, setError] = useState(false);

  // List of students
  const STUDENTS = [
    { name: "Ashri Singh", image: "/faces/Ashri_singh.jpg" },
    { name: "Sumit Sinha", image: "/faces/rohan_verma.jpg" },
    { name: "Aaditya Kumar", image: "/faces/Aaditya_kumar.jpg" },
    { name: "Shilpi", image: "/faces/Shilpi.jpg" },
  ];

  // Load models and start webcam
  useEffect(() => {
    async function setup() {
      try {
        setLoadingMessage("Loading AI Models...");

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
          faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
          faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
        ]);

        setLoadingMessage("Starting Webcam...");
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Initialization Error:", err);
        setError(true);
      }
    }
    setup();
  }, []);

  // Load student images
  async function getLabeledFaceDescriptions() {
    setLoadingMessage("Learning Student Faces...");
    return Promise.all(
      STUDENTS.map(async (student) => {
        try {
          const img = await faceapi.fetchImage(student.image);
          const detections = await faceapi
            .detectSingleFace(img)
            .withFaceLandmarks()
            .withFaceDescriptor();

          if (!detections) {
            console.warn(`No face found for ${student.name}`);
            return null;
          }
          return new faceapi.LabeledFaceDescriptors(student.name, [
            detections.descriptor,
          ]);
        } catch (e) {
          console.error(`Error loading ${student.name}`, e);
          return null;
        }
      })
    ).then((descs) => descs.filter((d) => d !== null));
  }

  // Face detection loop
  useEffect(() => {
    if (!videoRef.current) return;

    let interval;
    videoRef.current.addEventListener("play", async () => {
      const labeledFaceDescriptors = await getLabeledFaceDescriptions();
      if (!labeledFaceDescriptors || labeledFaceDescriptors.length === 0) {
        setLoadingMessage("Error: No student faces learned.");
        return;
      }

      const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);

      setLoadingMessage("Ready!");
      const displaySize = {
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight,
      };
      faceapi.matchDimensions(canvasRef.current, displaySize);

      interval = setInterval(async () => {
        const detections = await faceapi
          .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptors();

        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        const results = resizedDetections.map((d) =>
          faceMatcher.findBestMatch(d.descriptor)
        );

        results.forEach((result, i) => {
          const box = resizedDetections[i].detection.box;
          new faceapi.draw.DrawBox(box, { label: result.toString() }).draw(
            canvasRef.current
          );

          const studentName = result.label;
          if (studentName !== "unknown" && attendance[studentName]?.status !== "present") {
            const now = new Date();
            setAttendance((prev) => ({
              ...prev,
              [studentName]: { status: "present", timestamp: now },
            }));
          }
        });
      }, 200);
    });

    return () => clearInterval(interval);
  }, [videoRef.current]);

  // Download attendance as CSV
  function downloadAttendanceReport() {
    let csvContent = "Student Name,Status,Timestamp\n";
    STUDENTS.forEach((s) => {
      const record = attendance[s.name];
      const status = record?.status === "present" ? "Present" : "Absent";
      const timestamp = record?.timestamp
        ? record.timestamp.toLocaleString()
        : "N/A";
      csvContent += `"${s.name}","${status}","${timestamp}"\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "attendance_report.csv";
    link.click();
  }

  return (
    <div className="bg-gray-900 text-gray-100 flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white">Attendance System</h1>
          <p className="text-lg text-gray-400 mt-2">Team VisionForge...!</p>
        </header>

        <main className="grid md:grid-cols-3 gap-8">
          {/* Video */}
          <div className="md:col-span-2 bg-gray-800 p-4 rounded-lg shadow-2xl">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="absolute top-0 left-0 w-full h-full rounded-md"
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full rounded-md"
              />
              <div className="absolute bottom-2 left-2 text-sm text-gray-300 bg-black bg-opacity-50 px-2 py-1 rounded">
                {loadingMessage}
              </div>
            </div>
            {error && (
              <div className="text-red-500 mt-2">
                Webcam error. Please allow camera access.
              </div>
            )}
          </div>

          {/* Attendance List */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
              <h2 className="text-2xl font-semibold">Attendance Roll</h2>
              <button
                onClick={downloadAttendanceReport}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors duration-200"
              >
                Download Report
              </button>
            </div>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {STUDENTS.map((s) => {
                const record = attendance[s.name];
                const status = record?.status || "absent";
                return (
                  <div
                    key={s.name}
                    className="flex items-center justify-between p-3 bg-gray-700 rounded-md"
                  >
                    <div className="flex items-center">
                      <span
                        className={`w-3 h-3 rounded-full mr-3 ${
                          status === "present" ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                      <span className="font-medium">{s.name}</span>
                    </div>
                    <span
                      className={`text-sm ${
                        status === "present"
                          ? "text-green-400"
                          : "text-gray-400"
                      }`}
                    >
                      {status === "present"
                        ? `Present at ${record.timestamp.toLocaleTimeString()}`
                        : "Absent"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
