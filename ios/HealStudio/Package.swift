// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "HealStudio",
    platforms: [.iOS(.v17)],
    dependencies: [
        .package(url: "https://github.com/google/GoogleSignIn-iOS", from: "7.0.0"),
    ],
    targets: [
        .executableTarget(
            name: "HealStudio",
            dependencies: [
                .product(name: "GoogleSignIn", package: "GoogleSignIn-iOS"),
                .product(name: "GoogleSignInSwift", package: "GoogleSignIn-iOS"),
            ],
            path: "HealStudio"
        ),
    ]
)
