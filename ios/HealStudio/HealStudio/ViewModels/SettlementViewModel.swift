import Foundation
import Observation

@Observable
final class SettlementViewModel {
    var currentMonth: Date = Date()
    var monthlyData: [MonthlySettlement] = []
    var allInstructors: [Instructor] = []
    var isLoading = false
    var isSyncing = false
    var selectedInstructorId: String?
    var expandedInstructorId: String?

    var monthString: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM"
        return formatter.string(from: currentMonth)
    }

    var monthDisplayTitle: String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "pl_PL")
        formatter.dateFormat = "LLLL yyyy"
        let title = formatter.string(from: currentMonth)
        return title.prefix(1).uppercased() + title.dropFirst()
    }

    var totalHours: Int {
        monthlyData.reduce(0) { $0 + $1.totalHours }
    }

    var totalPrice: Int {
        monthlyData.reduce(0) { $0 + $1.totalPrice }
    }

    var totalShare: Int {
        monthlyData.reduce(0) { $0 + $1.totalShare }
    }

    func fetchSettlements(silent: Bool = false) async {
        if !silent { isLoading = true }
        defer { if !silent { isLoading = false } }

        do {
            let data = try await SettlementsAPI.fetchMonthly(
                month: monthString,
                instructorId: selectedInstructorId
            )
            if data != monthlyData {
                monthlyData = data
            }
        } catch {
            print("Failed to fetch settlements: \(error)")
        }
    }

    func syncSettlements() async {
        isSyncing = true
        defer { isSyncing = false }

        do {
            _ = try await SettlementsAPI.sync()
            await fetchSettlements()
        } catch {
            await fetchSettlements()
        }
    }

    func loadInstructors() async {
        do {
            allInstructors = try await InstructorCache.shared.getInstructors()
        } catch {
            print("Failed to load instructors: \(error)")
        }
    }

    func navigateMonth(direction: Int) {
        if let newMonth = Calendar.current.date(byAdding: .month, value: direction, to: currentMonth) {
            currentMonth = newMonth
            Task { await fetchSettlements() }
        }
    }

    func instructorColor(for id: String) -> String {
        allInstructors.first(where: { $0.id == id })?.color ?? "#999999"
    }

    func toggleExpanded(_ instructorId: String) {
        expandedInstructorId = expandedInstructorId == instructorId ? nil : instructorId
    }
}
