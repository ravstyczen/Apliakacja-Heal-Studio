import Foundation

enum InstructorsAPI {
    static func fetchAll() async throws -> [Instructor] {
        try await APIClient.shared.request(.get, path: "/api/instructors")
    }

    static func updateAll(_ instructors: [Instructor]) async throws {
        struct Body: Encodable {
            let instructors: [Instructor]
        }
        try await APIClient.shared.requestVoid(.put, path: "/api/instructors", body: Body(instructors: instructors))
    }
}

actor InstructorCache {
    static let shared = InstructorCache()

    private var cached: [Instructor]?
    private var fetchTask: Task<[Instructor], Error>?

    func getInstructors(forceRefresh: Bool = false) async throws -> [Instructor] {
        if !forceRefresh, let cached {
            return cached
        }

        if let fetchTask {
            return try await fetchTask.value
        }

        let task = Task<[Instructor], Error> {
            let instructors = try await InstructorsAPI.fetchAll()
            self.cached = instructors
            self.fetchTask = nil
            return instructors
        }
        self.fetchTask = task
        return try await task.value
    }

    func invalidate() {
        cached = nil
    }
}
