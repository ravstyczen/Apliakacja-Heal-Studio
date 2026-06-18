import SwiftUI

struct ContentView: View {
    @Environment(AuthViewModel.self) private var authVM
    @State private var activeTab: AppTab = .calendar

    var body: some View {
        Group {
            if authVM.isLoading {
                loadingView
            } else if !authVM.isAuthenticated || !AuthService.shared.isSignedIn {
                LoginView()
            } else if authVM.currentInstructor == nil {
                UnauthorizedView(email: AuthService.shared.userEmail ?? "")
            } else {
                mainApp
            }
        }
    }

    private var loadingView: some View {
        VStack {
            Spacer()
            Text("HEAL")
                .font(.system(size: 36, weight: .bold, design: .serif))
                .foregroundColor(.healPrimary)
                .tracking(6)
            LoadingSpinner()
                .padding(.top, 16)
            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.healBg)
    }

    private var mainApp: some View {
        VStack(spacing: 0) {
            topBar

            ZStack {
                CalendarView()
                    .opacity(activeTab == .calendar ? 1 : 0)

                ClientListView()
                    .opacity(activeTab == .clients ? 1 : 0)

                if authVM.isAdmin {
                    SettlementView()
                        .opacity(activeTab == .settlements ? 1 : 0)

                    InstructorSettingsView()
                        .opacity(activeTab == .instructors ? 1 : 0)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)

            NavigationTabBar(activeTab: $activeTab, isAdmin: authVM.isAdmin)
        }
        .background(Color.healBg)
    }

    private var topBar: some View {
        HStack {
            HStack(spacing: 8) {
                Text("HEAL")
                    .font(.system(size: 18, weight: .bold, design: .serif))
                    .foregroundColor(.healPrimary)
                    .tracking(4)

                Text("Pilates Studio")
                    .font(.system(size: 9, weight: .medium))
                    .foregroundColor(.healAccent)
                    .tracking(2)
                    .textCase(.uppercase)
            }

            Spacer()

            if let instructor = authVM.currentInstructor {
                Text(instructor.initials)
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(.white)
                    .frame(width: 28, height: 28)
                    .background(Color(hex: instructor.color))
                    .clipShape(Circle())
            }

            Button {
                authVM.signOut()
            } label: {
                Text("Wyloguj")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.gray)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(
            Color.healBg
                .shadow(color: .black.opacity(0.03), radius: 2, y: 1)
        )
    }
}
