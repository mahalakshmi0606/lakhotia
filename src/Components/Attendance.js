import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Table,
  Alert,
  Badge,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

const API_URL = "http://localhost:5000/api/attendance"; // Flask backend base URL

const Attendance = () => {
  const username = localStorage.getItem("username") || "Employee";
  const email = localStorage.getItem("email") || "";

  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [currentStatus, setCurrentStatus] = useState("offline");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [message, setMessage] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);

  // 🕒 Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 🔄 Fetch attendance by email
  useEffect(() => {
    const fetchAttendance = async () => {
      if (!email) return;
      try {
        const res = await fetch(`${API_URL}/email/${email}`);
        if (!res.ok) throw new Error("Failed to fetch attendance");
        const data = await res.json();
        setAttendanceRecords(data || []);

        const today = new Date().toISOString().split("T")[0];
        const active = data.some(
          (r) => r.date === today && r.status === "checked-in"
        );
        setCurrentStatus(active ? "online" : "offline");
      } catch (err) {
        console.error("Error fetching records:", err);
      }
    };
    fetchAttendance();
  }, [email]);

  // 📱 Get device info
  const getDeviceInfo = () => {
    const userAgent = navigator.userAgent || "";
    const platform = navigator.platform || "";
    let deviceType = "Desktop";
    if (/Mobi|Android/i.test(userAgent)) deviceType = "Mobile";
    else if (/iPad|Tablet/i.test(userAgent)) deviceType = "Tablet";
    return { userAgent, platform, deviceType };
  };

  // 📍 Get user coordinates
  const getPosition = () => {
    return new Promise((resolve, reject) => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) =>
            resolve({
              lat: pos.coords.latitude,
              lon: pos.coords.longitude,
            }),
          (err) => reject(err),
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } else reject(new Error("Geolocation not supported"));
    });
  };

  // 🌍 Reverse geocode to address
  const getAddressFromCoords = async (lat, lon) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
      const resp = await fetch(url);
      const data = await resp.json();
      return data.display_name || `Lat: ${lat}, Lon: ${lon}`;
    } catch {
      return `Lat: ${lat}, Lon: ${lon}`;
    }
  };

  // ✅ Handle Check-In
  const handleCheckIn = async () => {
    const today = new Date().toISOString().split("T")[0];
    const time = new Date().toLocaleTimeString("en-US");

    try {
      const { lat, lon } = await getPosition();
      const address = await getAddressFromCoords(lat, lon);
      const deviceInfo = getDeviceInfo();

      const payload = {
        email,
        username,
        date: today,
        checkIn: time,
        device: deviceInfo,
        location: { lat, lon, address },
      };

      const res = await fetch(`${API_URL}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setAttendanceRecords((prev) => [data.record, ...prev]);
        setCurrentStatus("online");
        setMessage(`✅ Checked in at ${time} (${deviceInfo.deviceType})`);
      } else {
        setMessage(data.message || "Check-in failed");
      }
    } catch (err) {
      console.error("Check-in error:", err);
      setMessage("Could not get location/device info.");
    }
    setTimeout(() => setMessage(""), 5000);
  };

  // 🛑 Handle Check-Out
  const handleCheckOut = async () => {
    const today = new Date().toISOString().split("T")[0];
    const time = new Date().toLocaleTimeString("en-US");

    try {
      const { lat, lon } = await getPosition();
      const address = await getAddressFromCoords(lat, lon);
      const deviceInfo = getDeviceInfo();

      const payload = {
        email,
        username,
        date: today,
        checkOut: time,
        deviceOut: deviceInfo,
        locationOut: { lat, lon, address },
      };

      const res = await fetch(`${API_URL}/checkout`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setAttendanceRecords((prev) =>
          prev.map((r) => (r.date === today ? { ...r, ...data.record } : r))
        );
        setCurrentStatus("offline");
        setMessage(`✅ Checked out at ${time} (${deviceInfo.deviceType})`);
      } else {
        setMessage(data.message || "Check-out failed");
      }
    } catch (err) {
      console.error("Check-out error:", err);
      setMessage("Could not get location/device info.");
    }
    setTimeout(() => setMessage(""), 5000);
  };

  // 🕓 Total Hours Today
  const getTotalHoursToday = () => {
    const today = new Date().toISOString().split("T")[0];
    return attendanceRecords
      .filter((r) => r.date === today && r.check_out)
      .reduce((total, r) => total + (r.duration || 0), 0)
      .toFixed(2);
  };

  const renderDevice = (device) =>
    device
      ? `${device.deviceType || "-"} (${device.platform || "-"})`
      : "N/A";

  const renderLocation = (loc) =>
    loc ? loc.address || `Lat: ${loc.lat}, Lon: ${loc.lon}` : "N/A";

  return (
    <Container className="mt-4">
      <Row className="justify-content-center">
        <Col md={10}>
          <h1 className="text-center mb-4">Attendance System</h1>

          {/* Status Card */}
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <Row className="align-items-center">
                <Col md={6}>
                  <h5>Current Time: {currentTime.toLocaleTimeString()}</h5>
                  <h6>Date: {currentTime.toLocaleDateString("en-IN")}</h6>
                  <h6>
                    User: <strong>{username}</strong>
                  </h6>
                  <h6 className="text-muted">
                    Email: <strong>{email}</strong>
                  </h6>
                </Col>
                <Col md={6} className="text-end">
                  <Badge
                    bg={currentStatus === "online" ? "success" : "danger"}
                    className="fs-6 p-2"
                  >
                    {currentStatus === "online" ? "🟢 Online" : "🔴 Offline"}
                  </Badge>
                  <div className="mt-2">
                    <small className="text-muted">
                      Total Hours Today: {getTotalHoursToday()}h
                    </small>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Alerts */}
          {message && (
            <Alert
              variant={message.includes("✅") ? "success" : "warning"}
              dismissible
              onClose={() => setMessage("")}
            >
              {message}
            </Alert>
          )}

          {/* Action Buttons */}
          <Card className="mb-4 shadow-sm text-center">
            <Card.Body>
              <Button
                variant="success"
                size="lg"
                onClick={handleCheckIn}
                disabled={currentStatus === "online"}
                className="me-3"
              >
                Check In
              </Button>
              <Button
                variant="danger"
                size="lg"
                onClick={handleCheckOut}
                disabled={currentStatus === "offline"}
              >
                Check Out
              </Button>
            </Card.Body>
          </Card>

          {/* Attendance Table */}
          <Card className="shadow-sm">
            <Card.Header>
              <h5 className="mb-0">Attendance History</h5>
            </Card.Header>
            <Card.Body>
              {attendanceRecords.length === 0 ? (
                <div className="text-center text-muted py-4">
                  <h6>No attendance records found</h6>
                  <p>Check in to start tracking your attendance</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Check In</th>
                        <th>Check Out</th>
                        <th>Duration</th>
                        <th>Status</th>
                        <th>View</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceRecords.map((r) => (
                        <tr key={r.id}>
                          <td>{r.date}</td>
                          <td>
                            {r.check_in || "-"}
                            <br />
                            <small>Device: {renderDevice(r.device_in)}</small>
                            <br />
                            <small>
                              Location: {renderLocation(r.location_in)}
                            </small>
                          </td>
                          <td>
                            {r.check_out || "-"}
                            {r.check_out && (
                              <>
                                <br />
                                <small>
                                  Device: {renderDevice(r.device_out)}
                                </small>
                                <br />
                                <small>
                                  Location: {renderLocation(r.location_out)}
                                </small>
                              </>
                            )}
                          </td>
                          <td>{r.duration ? `${r.duration}h` : "-"}</td>
                          <td>
                            <Badge
                              bg={
                                r.status === "checked-in"
                                  ? "warning"
                                  : "success"
                              }
                            >
                              {r.status === "checked-in"
                                ? "In Progress"
                                : "Completed"}
                            </Badge>
                          </td>
                          <td className="text-center">
                            <Button
                              variant="info"
                              size="sm"
                              onClick={() =>
                                setSelectedLocation(
                                  r.location_out || r.location_in
                                )
                              }
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Location Map Viewer */}
          {selectedLocation && (
            <Card className="mt-4 shadow-sm">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <strong>Location View</strong>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => setSelectedLocation(null)}
                >
                  Close
                </Button>
              </Card.Header>
              <Card.Body>
                <p>
                  <strong>Address:</strong>{" "}
                  {selectedLocation.address || "N/A"}
                </p>
                <div style={{ height: "400px", width: "100%" }}>
                  <iframe
                    title="Location Map"
                    width="100%"
                    height="100%"
                    style={{ border: 0, borderRadius: "10px" }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lon}&hl=es;z=14&output=embed`}
                  ></iframe>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default Attendance;
