# Base images are digest-pinned: unpinned tags re-resolve from the registry on
# every build, and any upstream release silently busts the whole layer cache.
# To upgrade: change the digest deliberately, expect one slow rebuild.
FROM golang:1.23-alpine@sha256:383395b794dffa5b53012a212365d40c8e37109a626ca30d6151c8348d380b5f AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/admin-reports ./cmd/server

FROM gcr.io/distroless/static-debian12:nonroot@sha256:d093aa3e30dbadd3efe1310db061a14da60299baff8450a17fe0ccc514a16639
COPY --from=build /out/admin-reports /admin-reports
EXPOSE 8090
USER nonroot:nonroot
ENTRYPOINT ["/admin-reports"]
