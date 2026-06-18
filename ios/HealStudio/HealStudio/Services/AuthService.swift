import Foundation
import GoogleSignIn

@Observable
final class AuthService {
    static let shared = AuthService()

    private(set) var currentUser: GIDGoogleUser?
    private(set) var isSignedIn = false

    var userEmail: String? {
        currentUser?.profile?.email
    }

    var userName: String? {
        currentUser?.profile?.name
    }

    private init() {}

    func restorePreviousSignIn() async -> Bool {
        do {
            let user = try await GIDSignIn.sharedInstance.restorePreviousSignIn()
            self.currentUser = user
            self.isSignedIn = true
            return true
        } catch {
            self.currentUser = nil
            self.isSignedIn = false
            return false
        }
    }

    @MainActor
    func signIn(presenting viewController: UIViewController) async throws {
        let result = try await GIDSignIn.sharedInstance.signIn(withPresenting: viewController)
        self.currentUser = result.user
        self.isSignedIn = true
    }

    func signOut() {
        GIDSignIn.sharedInstance.signOut()
        self.currentUser = nil
        self.isSignedIn = false
    }

    func getIDToken() async throws -> String {
        guard let user = currentUser else {
            throw APIError.noAuthToken
        }

        // Refresh tokens if needed
        try await user.refreshTokensIfNeeded()

        guard let idToken = user.idToken?.tokenString else {
            throw APIError.noAuthToken
        }

        return idToken
    }
}
