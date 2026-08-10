/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react"
import DashboardLayout from "@/app/(dashboard)/layout"

const mockUsePathname = jest.fn()

jest.mock("next/navigation", () => ({
    usePathname: () => mockUsePathname(),
}))

jest.mock("next/link", () => {
    return function Link({ children, ...props }: { children: React.ReactNode } & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
        return <a {...props}>{children}</a>
    }
})

describe("DashboardLayout", () => {
    it("renders navigation links to all dashboard pages", () => {
        mockUsePathname.mockReturnValue("/dashboard")
        render(<DashboardLayout><div>content</div></DashboardLayout>)

        expect(screen.getByRole("link", { name: /Dashboard/ }).getAttribute("href")).toBe("/dashboard")
        expect(screen.getByRole("link", { name: /Productos/ }).getAttribute("href")).toBe("/dashboard/products")
        expect(screen.getByRole("link", { name: /Categorías/ }).getAttribute("href")).toBe("/dashboard/categories")
    })

    it("marks the current page link as active", () => {
        mockUsePathname.mockReturnValue("/dashboard/products")
        render(<DashboardLayout><div>content</div></DashboardLayout>)

        const productsLink = screen.getByRole("link", { name: /Productos/ })
        expect(productsLink.getAttribute("aria-current")).toBe("page")

        const dashboardLink = screen.getByRole("link", { name: /Dashboard/ })
        expect(dashboardLink.getAttribute("aria-current")).toBeNull()
    })
})
