import Foundation

@Observable
final class SessionFormViewModel {
    var sessionType: SessionType = .solo
    var date: Date = Date()
    var startHour: Int = 10
    var endHour: Int = 11
    var instructorId: String = ""
    var instructorName: String = ""
    var clientIds: [String] = []
    var clientNames: [String] = []
    var isRecurring = false
    var recurringEndDate: Date = Calendar.current.date(byAdding: .month, value: 1, to: Date())!
    var isOpenSession = false
    var bookingToken: String?
    var isEditing = false
    var isSaving = false
    var isDeleting = false
    var showRecurringEditSheet = false
    var showClientPicker = false
    var pendingEditMode: RecurringEditMode?
    var errorMessage: String?

    private var originalSession: Session?

    var startTime: String { String(format: "%02d:00", startHour) }
    var endTime: String { String(format: "%02d:00", endHour) }

    var dateString: String {
        CalendarViewModel.formatDate(date)
    }

    var bookingURL: String? {
        guard isOpenSession, let token = bookingToken else { return nil }
        return "\(APIConfig.baseURL.absoluteString)/book/\(token)"
    }

    var canSave: Bool {
        !instructorId.isEmpty
    }

    func configure(session: Session?, date: String?, hour: Int?, allInstructors: [Instructor], currentInstructor: Instructor?) {
        if let session {
            originalSession = session
            isEditing = true
            sessionType = session.type
            if let d = Self.parseDate(session.date) { self.date = d }
            startHour = session.startHour
            endHour = Int(session.endTime.components(separatedBy: ":").first ?? "0") ?? startHour + 1
            instructorId = session.instructorId
            instructorName = session.instructorName
            clientIds = session.clientIds
            clientNames = session.clientNames
            isRecurring = session.isRecurring
            if let endDate = session.recurringEndDate, let d = Self.parseDate(endDate) {
                recurringEndDate = d
            }
            isOpenSession = session.isOpenSession
            bookingToken = session.bookingToken
        } else {
            isEditing = false
            if let date, let d = Self.parseDate(date) { self.date = d }
            if let hour {
                startHour = hour
                endHour = hour + 1
            }
            if let instructor = currentInstructor {
                instructorId = instructor.id
                instructorName = instructor.name
            } else if let first = allInstructors.first {
                instructorId = first.id
                instructorName = first.name
            }
        }
    }

    func selectInstructor(_ instructor: Instructor) {
        instructorId = instructor.id
        instructorName = instructor.name
    }

    func addClient(id: String, name: String) {
        guard !clientIds.contains(id) else { return }
        clientIds.append(id)
        clientNames.append(name)
    }

    func removeClient(at index: Int) {
        guard index < clientIds.count else { return }
        clientIds.remove(at: index)
        clientNames.remove(at: index)
    }

    func generateBookingToken() {
        bookingToken = UUID().uuidString.replacingOccurrences(of: "-", with: "").prefix(12).lowercased()
    }

    func save(editMode: RecurringEditMode? = nil) async -> Bool {
        isSaving = true
        errorMessage = nil
        defer { isSaving = false }

        do {
            if isEditing, let session = originalSession {
                let req = SessionUpdateRequest(
                    eventId: session.calendarEventId,
                    date: dateString,
                    startTime: startTime,
                    endTime: endTime,
                    type: sessionType.rawValue,
                    instructorId: instructorId,
                    instructorName: instructorName,
                    clientIds: clientIds,
                    clientNames: clientNames,
                    isRecurring: isRecurring,
                    recurringEndDate: isRecurring ? formatDate(recurringEndDate) : nil,
                    isOpenSession: isOpenSession,
                    bookingToken: isOpenSession ? bookingToken : nil,
                    editMode: editMode?.rawValue
                )
                try await SessionsAPI.updateSession(req)
            } else {
                if isOpenSession && bookingToken == nil {
                    generateBookingToken()
                }
                let req = SessionCreateRequest(
                    date: dateString,
                    startTime: startTime,
                    endTime: endTime,
                    type: sessionType.rawValue,
                    instructorId: instructorId,
                    instructorName: instructorName,
                    clientIds: clientIds,
                    clientNames: clientNames,
                    isRecurring: isRecurring,
                    recurringEndDate: isRecurring ? formatDate(recurringEndDate) : nil,
                    isOpenSession: isOpenSession,
                    bookingToken: isOpenSession ? bookingToken : nil
                )
                _ = try await SessionsAPI.createSession(req)
            }
            return true
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }

    func delete(editMode: RecurringEditMode = .single) async -> Bool {
        guard let session = originalSession else { return false }
        isDeleting = true
        errorMessage = nil
        defer { isDeleting = false }

        do {
            try await SessionsAPI.deleteSession(
                eventId: session.calendarEventId,
                editMode: editMode,
                date: session.date,
                instructorId: session.instructorId,
                sessionType: session.type.rawValue,
                startTime: session.startTime
            )
            return true
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }

    private func formatDate(_ date: Date) -> String {
        CalendarViewModel.formatDate(date)
    }

    static func parseDate(_ string: String) -> Date? {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = TimeZone(identifier: "Europe/Warsaw")
        return formatter.date(from: string)
    }
}
