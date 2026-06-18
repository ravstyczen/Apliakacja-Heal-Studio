import Foundation
import SwiftUI

@Observable
final class AuthViewModel {
    var isAuthenticated = false
    var currentInstructor: Instructor?
    var isLoading = true
    var errorMessage: String?

    var isAdmin: Bool {
        currentInstructor?.role.isAdminOrOwner ?? false
    }

    func checkAuth() async {
        isLoading = true
        let restored = await AuthService.shared.restorePreviousSignIn()
        if restored {
            await resolveInstructor()
        }
        isLoading = false
    }

    @MainActor
    func signIn(from viewController: UIViewController) async {
        do {
            try await AuthService.shared.signIn(presenting: viewController)
            await resolveInstructor()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func signOut() {
        AuthService.shared.signOut()
        isAuthenticated = false
        currentInstructor = nil
    }

    private func resolveInstructor() async {
        guard let email = AuthService.shared.userEmail else {
            isAuthenticated = false
            return
        }

        do {
            let instructors = try await InstructorCache.shared.getInstructors()
            if let found = instructors.first(where: { $0.email == email }) {
                currentInstructor = found
                isAuthenticated = true
            } else {
                currentInstructor = nil
                isAuthenticated = true
                errorMessage = "Twoje konto (\(email)) nie ma dostepu do aplikacji."
            }
        } catch {
            errorMessage = "Nie udalo sie zweryfikowac konta"
            isAuthenticated = false
        }
    }
}
