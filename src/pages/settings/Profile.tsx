import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAuthStore } from "../../store/authStore"
import { useNavigate } from "react-router-dom"
import { staffApi, UserProfileData } from "../../api/staff"
import StaffAvatar from "../../components/staff/StaffAvatar"
import {
  Calendar,
  Mail,
  Phone,
  Building2,
  ArrowLeft,
  Edit,
} from "lucide-react"
import { format } from "date-fns"

const Profile = () => {
  const { user } = useAuthStore()
  const staffId = (user as any)?.staff_id
  const navigate = useNavigate()

  const { data: profile, isLoading } = useQuery<UserProfileData>({
    queryKey: ["user-profile", staffId],
    queryFn: () => staffApi.getProfile(staffId),
    enabled: !!staffId,
  })

  /**
   * Attendance map
   */
  const attendanceMap = useMemo(() => {
    const map = new Map<string, number>()

    if (profile?.attendance_records) {
      for (const r of profile.attendance_records) {
        const dt = new Date(r.date)
        const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`
        map.set(key, r.work_hours || 0)
      }
    }

    return map
  }, [profile])

  /**
   * Generate last 12 months calendar
   */
  const months = useMemo(() => {
    const result: {
      label: string
      days: (string | null)[]
    }[] = []

    const end = new Date()
    end.setHours(0, 0, 0, 0)

    const start = new Date(end)
    start.setFullYear(start.getFullYear() - 1)
    start.setDate(1)

    const cursor = new Date(start.getFullYear(), start.getMonth(), 1)

    const toKey = (dt: Date) => {
      const y = dt.getFullYear()
      const m = String(dt.getMonth() + 1).padStart(2, "0")
      const d = String(dt.getDate()).padStart(2, "0")
      return `${y}-${m}-${d}`
    }

    while (cursor <= end) {
      const year = cursor.getFullYear()
      const month = cursor.getMonth()

      const first = new Date(year, month, 1)
      const last = new Date(year, month + 1, 0)

      const days: (string | null)[] = []

      const offset = first.getDay()

      for (let i = 0; i < offset; i++) {
        days.push(null)
      }

      const d = new Date(first)

      while (d <= last) {
        days.push(toKey(d))
        d.setDate(d.getDate() + 1)
      }

      const remainder = days.length % 7
      if (remainder !== 0) {
        const fill = 7 - remainder
        for (let i = 0; i < fill; i++) {
          days.push(null)
        }
      }

      result.push({
        label: format(first, "LLLL yyyy"),
        days,
      })

      cursor.setMonth(cursor.getMonth() + 1)
    }

    return result
  }, [])

  /**
   * Attendance heat colors
   */
  const getColor = (hours: number | undefined) => {
    if (!hours || hours <= 0) return "bg-gray-100"
    if (hours < 2) return "bg-teal-100"
    if (hours < 4) return "bg-teal-300"
    if (hours < 8) return "bg-teal-500"
    return "bg-teal-700"
  }

  const fromKey = (key: string) => {
    const [y, m, d] = key.split("-").map(Number)
    return new Date(y, (m as number) - 1, d as number, 12, 0, 0, 0)
  }

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100 flex items-center justify-center">
            <StaffAvatar
              filename={profile?.profile_image}
              alt={`${profile?.first_name || ""} ${profile?.last_name || ""}`}
              className="w-full h-full"
              fallback={
                <div className="text-indigo-700 text-xl font-semibold">
                  {(profile?.first_name || "")?.[0]}
                  {(profile?.last_name || "")?.[0]}
                </div>
              }
            />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {profile
                ? `${profile.first_name} ${profile.last_name}`
                : "Profile"}
            </h1>

            <p className="text-sm text-gray-500">{profile?.designation}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white rounded-md transition-colors border border-transparent hover:border-gray-200"
            title="Back"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          {profile?.id && (
            <button
              onClick={() => navigate(`/staff/${profile.id}/edit`)}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm transition flex items-center gap-2"
              title="Edit Staff"
            >
              <Edit className="h-4 w-4" />
              Edit
            </button>
          )}
          <span
            className={`ml-2 text-sm font-medium ${
              profile?.is_active ? "text-green-600" : "text-gray-500"
            }`}
          >
            {profile?.is_active ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT PANEL */}
        <div className="space-y-6">
          {/* Contact */}
          <div className="bg-white p-6 rounded-md border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">Contact</h2>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                {profile?.email}
              </div>

              {profile?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  {profile.phone}
                </div>
              )}

              {profile?.work_location && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  {profile.work_location}
                </div>
              )}
            </div>
          </div>

          {/* Organization */}
          <div className="bg-white p-6 rounded-md border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">Organization</h2>

            <div className="space-y-4 text-sm">
              <div>
                <p className="text-gray-500">Department</p>
                <p>{profile?.department}</p>
              </div>

              <div>
                <p className="text-gray-500">Designation</p>
                <p>{profile?.designation}</p>
              </div>

              <div>
                <p className="text-gray-500">Employment Type</p>
                <p>{profile?.employment_type?.replace("_", " ")}</p>
              </div>

              <div>
                <p className="text-gray-500">Reporting Manager</p>
                <p>{profile?.reporting_manager || "N/A"}</p>
              </div>
              <div>
                <p className="text-gray-500">Reporting Manager ID</p>
                <p>{profile?.reporting_manager_code || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white p-6 rounded-md border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">Timeline</h2>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                {profile?.join_date
                  ? format(new Date(profile.join_date), "PPP")
                  : "—"}
              </div>

              {profile?.exit_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {format(new Date(profile.exit_date), "PPP")}
                </div>
              )}
              {profile?.exit_reason && (
                <div>
                  <p className="text-gray-500">Exit Reason</p>
                  <p>{profile.exit_reason}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-md border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {(profile?.skills || []).length === 0 ? (
                <span className="text-sm text-gray-500">—</span>
              ) : (
                profile!.skills.map((s, idx) => (
                  <span
                    key={`${s}-${idx}`}
                    className="px-3 py-1 rounded-md text-sm bg-teal-50 text-teal-700 border border-teal-200"
                  >
                    {s}
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-md border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">System Information</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500">Employee Code</p>
                <p>{profile?.employee_code || "N/A"}</p>
              </div>
              <div>
                <p className="text-gray-500">Account Status</p>
                <p className={profile?.is_active ? "text-green-600" : "text-gray-600"}>
                  {profile?.is_active ? "Active" : "Inactive"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="lg:col-span-2 space-y-6">
          {/* Attendance */}
          <div className="bg-white p-6 rounded-md border border-gray-200">
            <h2 className="text-lg font-semibold mb-6">Attendance</h2>

            <div className="overflow-x-auto">
              <div className="flex gap-8">
                {months.map((month, index) => (
                <div
                  key={index}
                  className="border-l pl-4 shrink-0"
                  style={{ minWidth: 164 }}
                >
                    <div className="text-xs font-semibold text-gray-600 mb-2 text-center">
                      {month.label}
                    </div>

                    {/* Weekday labels */}
                    <div className="grid grid-cols-7 text-[10px] text-gray-400 mb-1">
                      <span>Su</span>
                      <span>Mo</span>
                      <span>Tu</span>
                      <span>We</span>
                      <span>Th</span>
                      <span>Fr</span>
                      <span>Sa</span>
                    </div>

                    {/* Calendar */}
                    <div className="grid grid-cols-7 gap-1">
                      {month.days.map((d, i) => {
                        if (!d) {
                          return (
                            <div key={i} className="h-5 w-5"></div>
                          )
                        }

                        const hours = attendanceMap.get(d)
                        const day = parseInt(d.split("-")[2], 10)

                        return (
                          <div
                            key={d}
                            title={`${format(
                              fromKey(d),
                              "PPP"
                            )}: ${hours || 0}h`}
                            className={`h-5 w-5 rounded-sm flex items-center justify-center ${getColor(
                              hours
                            )}`}
                          >
                            <span
                              className={`text-[9px] ${
                                hours
                                  ? "text-white"
                                  : "text-gray-500"
                              }`}
                            >
                              {day}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tenants */}
          <div className="bg-white p-6 rounded-md border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">Tenants</h2>
 
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(profile?.tenants || []).map((t) => (
                <div
                  key={t.id}
                  className="border border-gray-200 rounded-md p-4 bg-white shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{t.name}</div>
                      <div className="text-xs text-gray-500 mt-1">Code: {t.code || "—"}</div>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-md border ${
                        t.is_active
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-gray-50 text-gray-700 border-gray-200"
                      }`}
                    >
                      {t.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
