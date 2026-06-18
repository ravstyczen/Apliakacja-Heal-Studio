import SwiftUI

struct LoadingSpinner: View {
    var body: some View {
        ProgressView()
            .progressViewStyle(CircularProgressViewStyle(tint: .healPrimary))
            .scaleEffect(1.2)
    }
}

struct FullScreenLoading: View {
    var body: some View {
        VStack {
            Spacer()
            LoadingSpinner()
            Spacer()
        }
        .frame(maxWidth: .infinity)
    }
}
