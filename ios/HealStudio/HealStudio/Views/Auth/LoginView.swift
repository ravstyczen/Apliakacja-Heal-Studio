import SwiftUI

struct LoginView: View {
    @Environment(AuthViewModel.self) private var authVM

    var body: some View {
        VStack(spacing: 0) {
            Spacer()

            VStack(spacing: 8) {
                Text("HEAL")
                    .font(.system(size: 48, weight: .bold, design: .serif))
                    .foregroundColor(.healPrimary)
                    .tracking(8)

                Text("PILATES STUDIO")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(.healAccent)
                    .tracking(4)
            }

            Spacer()

            VStack(spacing: 16) {
                Button {
                    Task {
                        guard let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
                              let vc = scene.windows.first?.rootViewController else { return }
                        await authVM.signIn(from: vc)
                    }
                } label: {
                    HStack(spacing: 12) {
                        Image(systemName: "person.circle.fill")
                            .font(.system(size: 20))

                        Text("Zaloguj sie przez Google")
                            .font(.system(size: 15, weight: .semibold))
                    }
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Color.healPrimary)
                    .cornerRadius(12)
                }

                if let error = authVM.errorMessage {
                    Text(error)
                        .font(.system(size: 13))
                        .foregroundColor(.red)
                        .multilineTextAlignment(.center)
                }
            }
            .padding(.horizontal, 32)
            .padding(.bottom, 60)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.healBg)
    }
}
