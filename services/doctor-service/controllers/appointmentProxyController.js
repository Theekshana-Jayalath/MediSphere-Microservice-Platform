import Doctor from "../models/Doctor.js";

const APPOINTMENT_SERVICE_CANDIDATES = [
	process.env.APPOINTMENT_SERVICE_URL,
	process.env.APPOINTMENT_API_URL,
	"http://localhost:5002/api/appointments",
	"http://localhost:5015/api/appointments",
].filter(Boolean);

const normalizeValue = (value) => String(value || "").trim().toLowerCase();

const getAppointmentServiceUrls = () => {
	return APPOINTMENT_SERVICE_CANDIDATES.map((baseUrl) =>
		String(baseUrl).replace(/\/+$/, "")
	);
};

const requestAppointmentService = async (path = "", options = {}) => {
	const serviceUrls = getAppointmentServiceUrls();
	let lastError = null;

	for (const baseUrl of serviceUrls) {
		try {
			const response = await fetch(`${baseUrl}${path}`, {
				...options,
				headers: {
					"Content-Type": "application/json",
					...(options.headers || {}),
				},
			});

			const bodyText = await response.text();
			let payload = null;

			if (bodyText) {
				try {
					payload = JSON.parse(bodyText);
				} catch {
					payload = { message: bodyText };
				}
			}

			if (!response.ok) {
				const message =
					payload?.message ||
					`Appointment service responded with status ${response.status}`;
				const error = new Error(message);
				error.status = response.status;
				error.payload = payload;
				throw error;
			}

			return payload;
		} catch (error) {
			lastError = error;
		}
	}

	throw lastError || new Error("Unable to reach appointment service");
};

const resolveDoctorByIdentifiers = async (doctorIdentifier) => {
	if (!doctorIdentifier) {
		return null;
	}

	const orConditions = [{ _id: doctorIdentifier }, { doctorId: doctorIdentifier }];

	return Doctor.findOne({ $or: orConditions }).select("_id doctorId fullName");
};

const appointmentBelongsToDoctor = (appointment, doctorDoc, requestedIdentifier) => {
	const appointmentDoctorCandidates = [
		appointment?.doctorId,
		appointment?.doctor?._id,
		appointment?.doctor?.id,
		appointment?.doctor?.doctorId,
	].map(normalizeValue);

	const doctorCandidates = [doctorDoc?._id, doctorDoc?.doctorId, requestedIdentifier].map(
		normalizeValue
	);

	return appointmentDoctorCandidates.some(
		(appointmentDoctorId) => appointmentDoctorId && doctorCandidates.includes(appointmentDoctorId)
	);
};

const sortAppointments = (appointments) => {
	return [...appointments].sort((left, right) => {
		const leftDate = new Date(left?.appointmentDate || left?.createdAt || 0).getTime();
		const rightDate = new Date(right?.appointmentDate || right?.createdAt || 0).getTime();

		return rightDate - leftDate;
	});
};

export const getAppointmentsForDoctor = async (req, res, next) => {
	try {
		const requestedIdentifier = req.params.doctorId || req.query.doctorId || req.user?.id || "";

		if (!requestedIdentifier) {
			return res.status(400).json({
				success: false,
				message: "Doctor identifier is required",
			});
		}

		const doctor = await resolveDoctorByIdentifiers(requestedIdentifier);

		if (!doctor) {
			return res.status(404).json({
				success: false,
				message: "Doctor not found",
			});
		}

		const appointmentsPayload = await requestAppointmentService("/");
		const appointments = Array.isArray(appointmentsPayload)
			? appointmentsPayload
			: Array.isArray(appointmentsPayload?.data)
				? appointmentsPayload.data
				: [];

		const filteredAppointments = sortAppointments(
			appointments.filter((appointment) =>
				appointmentBelongsToDoctor(appointment, doctor, requestedIdentifier)
			)
		);

		return res.status(200).json({
			success: true,
			data: filteredAppointments,
			count: filteredAppointments.length,
			doctor: {
				id: doctor._id,
				doctorId: doctor.doctorId,
				fullName: doctor.fullName,
			},
		});
	} catch (error) {
		next(error);
	}
};

const mapStatusToAppointmentAction = (status) => {
	const normalizedStatus = normalizeValue(status);

	if (normalizedStatus === "confirmed") {
		return "approve";
	}

	if (
		normalizedStatus === "cancelled" ||
		normalizedStatus === "canceled" ||
		normalizedStatus === "rejected"
	) {
		return "reject";
	}

	if (normalizedStatus === "completed") {
		return "complete";
	}

	return "";
};

export const updateDoctorAppointmentStatus = async (req, res, next) => {
	try {
		const { appointmentId } = req.params;
		const { status } = req.body;

		if (!appointmentId) {
			return res.status(400).json({
				success: false,
				message: "Appointment id is required",
			});
		}

		const action = mapStatusToAppointmentAction(status);

		if (!action) {
			return res.status(400).json({
				success: false,
				message: "Unsupported status update. Use confirmed or cancelled.",
			});
		}

		const updatedAppointment = await requestAppointmentService(`/${appointmentId}/${action}`, {
			method: "PUT",
			body: JSON.stringify({}),
		});

		return res.status(200).json({
			success: true,
			message: "Appointment status updated successfully",
			data: updatedAppointment,
		});
	} catch (error) {
		next(error);
	}
};

