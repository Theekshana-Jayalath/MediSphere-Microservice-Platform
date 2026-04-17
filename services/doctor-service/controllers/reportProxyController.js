const PATIENT_SERVICE_API_CANDIDATES = [
  process.env.PATIENT_SERVICE_API_URL,
  process.env.PATIENT_SERVICE_URL,
  "http://localhost:5005/api",
  "http://localhost:5015/api",
].filter(Boolean);

const trimTrailingSlash = (value) => String(value || "").replace(/\/+$/, "");

const toArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.reports)) return payload.reports;
  return [];
};

const requestPatientService = async (path, options = {}) => {
  let lastError = null;

  for (const candidate of PATIENT_SERVICE_API_CANDIDATES) {
    const apiBase = trimTrailingSlash(candidate);

    try {
      const response = await fetch(`${apiBase}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
      });

      const rawText = await response.text();
      let payload = null;

      if (rawText) {
        try {
          payload = JSON.parse(rawText);
        } catch {
          payload = { message: rawText };
        }
      }

      if (!response.ok) {
        const error = new Error(
          payload?.message || `Patient service responded with ${response.status}`
        );
        error.status = response.status;
        error.payload = payload;
        throw error;
      }

      return { payload, apiBase };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Unable to reach patient service");
};

const normalizeFileUrl = (report, apiBase) => {
  const fileUrl = String(report?.fileUrl || report?.s3Url || "");

  if (!fileUrl || /^https?:\/\//i.test(fileUrl)) {
    return fileUrl;
  }

  const hostBase = apiBase.replace(/\/api\/?$/i, "");
  return `${hostBase}${fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`}`;
};

export const getDoctorReports = async (req, res, next) => {
  try {
    const doctorId = String(req.user?.id || "").trim();

    if (!doctorId) {
      return res.status(401).json({
        success: false,
        message: "Doctor session not found",
      });
    }

    const token = req.headers.authorization || "";
    const { payload, apiBase } = await requestPatientService(
      `/reports/doctor/${doctorId}`,
      {
        method: "GET",
        headers: token ? { Authorization: token } : {},
      }
    );

    const reports = toArray(payload).map((report) => ({
      ...report,
      fileUrl: normalizeFileUrl(report, apiBase),
    }));

    return res.status(200).json({
      success: true,
      data: reports,
      count: reports.length,
    });
  } catch (error) {
    next(error);
  }
};
