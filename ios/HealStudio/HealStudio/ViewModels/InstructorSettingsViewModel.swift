import Foundation
import Observation

@Observable
final class InstructorSettingsViewModel {
    var instructors: [Instructor] = []
    var isLoading = false
    var isSaving = false
    var editingId: String?
    var message: String?
    var isError = false

    func fetchInstructors() async {
        isLoading = true
        defer { isLoading = false }

        do {
            instructors = try await InstructorsAPI.fetchAll()
        } catch {
            print("Failed to fetch instructors: \(error)")
        }
    }

    func updatePricing(instructorId: String, type: SessionType, field: PricingField, value: Int) {
        guard let idx = instructors.firstIndex(where: { $0.id == instructorId }) else { return }

        switch (type, field) {
        case (.solo, .price): instructors[idx].pricing.solo.price = value
        case (.solo, .share): instructors[idx].pricing.solo.share = value
        case (.duo, .price): instructors[idx].pricing.duo.price = value
        case (.duo, .share): instructors[idx].pricing.duo.share = value
        case (.trio, .price): instructors[idx].pricing.trio.price = value
        case (.trio, .share): instructors[idx].pricing.trio.share = value
        }
    }

    func save() async {
        isSaving = true
        message = nil
        defer { isSaving = false }

        do {
            try await InstructorsAPI.updateAll(instructors)
            message = "Zapisano pomyslnie"
            isError = false
            editingId = nil
            await InstructorCache.shared.invalidate()
        } catch {
            message = "Wystapil blad podczas zapisywania"
            isError = true
        }

        // Clear message after 3 seconds
        Task {
            try? await Task.sleep(for: .seconds(3))
            message = nil
        }
    }

    func toggleEditing(_ id: String) {
        editingId = editingId == id ? nil : id
    }
}

enum PricingField {
    case price
    case share
}
