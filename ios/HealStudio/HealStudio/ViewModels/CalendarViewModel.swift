import Foundation
import SwiftUI

@Observable
final class CalendarViewModel {
    var weekStart: Date = CalendarViewModel.mondayOfWeek(for: Date())
    var sessions: [Session] = []
    var allInstructors: [Instructor] = []
    var isLoading = false
    var selectedSession: Session?
    var showSessionModal = false
    var selectedDate: String?
    var selectedHour: Int?

    private var pollingTask: Task<Void, Never>?

    var weekDays: [Date] {
        (0..<7).compactMap { Calendar.current.date(byAdding: .day, value: $0, to: weekStart) }
    }

    var monthYearTitle: String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "pl_PL")
        formatter.dateFormat = "LLLL yyyy"
        let title = formatter.string(from: weekStart)
        return title.prefix(1).uppercased() + title.dropFirst()
    }

    static func mondayOfWeek(for date: Date) -> Date {
        var cal = Calendar(identifier: .iso8601)
        cal.firstWeekday = 2 // Monday
        let components = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: date)
        return cal.date(from: components) ?? date
    }

    func fetchSessions(silent: Bool = false) async {
        if !silent { isLoading = true }
        defer { if !silent { isLoading = false } }

        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        let timeMin = formatter.string(from: weekStart) + "T00:00:00Z"
        let endDate = Calendar.current.date(byAdding: .day, value: 7, to: weekStart)!
        let timeMax = formatter.string(from: endDate) + "T23:59:59Z"

        do {
            let newSessions = try await SessionsAPI.fetchSessions(timeMin: timeMin, timeMax: timeMax)
            if newSessions != sessions {
                sessions = newSessions
            }
        } catch {
            print("Failed to fetch sessions: \(error)")
        }
    }

    func loadInstructors() async {
        do {
            allInstructors = try await InstructorCache.shared.getInstructors()
        } catch {
            print("Failed to load instructors: \(error)")
        }
    }

    func navigateWeek(direction: Int) {
        if let newStart = Calendar.current.date(byAdding: .weekOfYear, value: direction, to: weekStart) {
            weekStart = newStart
            Task { await fetchSessions() }
        }
    }

    func goToToday() {
        weekStart = Self.mondayOfWeek(for: Date())
        Task { await fetchSessions() }
    }

    func sessionsForSlot(date: Date, hour: Int) -> [Session] {
        let dateStr = Self.formatDate(date)
        return sessions.filter { $0.date == dateStr && $0.startHour == hour }
    }

    func instructorColor(for id: String) -> String {
        allInstructors.first(where: { $0.id == id })?.color ?? "#999999"
    }

    func openCreateSession(date: Date, hour: Int) {
        selectedDate = Self.formatDate(date)
        selectedHour = hour
        selectedSession = nil
        showSessionModal = true
    }

    func openEditSession(_ session: Session) {
        selectedSession = session
        selectedDate = session.date
        selectedHour = session.startHour
        showSessionModal = true
    }

    func startPolling() {
        pollingTask = Task { [weak self] in
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(15))
                guard !Task.isCancelled else { break }
                await self?.fetchSessions(silent: true)
            }
        }
    }

    func stopPolling() {
        pollingTask?.cancel()
        pollingTask = nil
    }

    func handleScenePhaseChange(_ phase: ScenePhase) {
        if phase == .active {
            Task { await fetchSessions(silent: true) }
        }
    }

    static func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = TimeZone(identifier: "Europe/Warsaw")
        return formatter.string(from: date)
    }

    static func isToday(_ date: Date) -> Bool {
        Calendar.current.isDateInToday(date)
    }

    static func dayAbbreviation(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "pl_PL")
        formatter.dateFormat = "EEE"
        return formatter.string(from: date).uppercased()
    }

    static func dayNumber(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "d"
        return formatter.string(from: date)
    }
}
