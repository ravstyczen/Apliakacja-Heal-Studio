import SwiftUI

struct UnauthorizedView: View {
    @Environment(AuthViewModel.self) private var authVM
    let email: String

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            Text("HEAL")
                .font(.system(size: 36, weight: .bold, design: .serif))
                .foregroundColor(.healPrimary)
                .tracking(6)

            VStack(spacing: 8) {
                Text("Twoje konto (\(email))")
                    .font(.system(size: 14))
                    .foregroundColor(.gray)

                Text("nie ma dostepu do aplikacji.")
                    .font(.system(size: 14))
                    .foregroundColor(.gray)

                Text("Skontaktuj sie z wlascicielem studia.")
                    .font(.system(size: 14))
                    .foregroundColor(.gray)
                    .padding(.top, 4)
            }
            .multilineTextAlignment(.center)

            Spacer()

            Button {
                authVM.signOut()
            } label: {
                Text("Wyloguj")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(.white)
                    .frame(width: 160)
                    .padding(.vertical, 12)
                    .background(Color.healPrimary)
                    .cornerRadius(12)
            }
            .padding(.bottom, 60)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.healBg)
    }
}
