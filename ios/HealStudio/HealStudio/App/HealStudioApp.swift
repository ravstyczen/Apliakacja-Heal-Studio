import SwiftUI
import GoogleSignIn

@main
struct HealStudioApp: App {
    @State private var authVM = AuthViewModel()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(authVM)
                .onOpenURL { url in
                    GIDSignIn.sharedInstance.handle(url)
                }
                .task {
                    await authVM.checkAuth()
                }
        }
    }
}
