/** @jest-environment jsdom */

import "@testing-library/jest-dom"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { act } from "react"
import SizeFilter from "@/components/shop/size-filter"

// Mock next/navigation
const mockPush = jest.fn()
const mockSearchParams = new URLSearchParams()

jest.mock("next/navigation", () => ({
    useSearchParams: () => mockSearchParams,
    useRouter: () => ({
        push: mockPush,
    }),
}))

describe("SizeFilter", () => {
    const availableSizes = ["S", "M", "L", "XL"]

    beforeEach(() => {
        jest.clearAllMocks()
        mockSearchParams.delete("size")
    })

    it("renders checkboxes for all available sizes", () => {
        render(<SizeFilter availableSizes={availableSizes} />)

        availableSizes.forEach(size => {
            expect(screen.getByText(size)).toBeInTheDocument()
        })
    })

    it("does not render checkboxes for sizes not in availableSizes", () => {
        render(<SizeFilter availableSizes={["M", "L"]} />)

        expect(screen.getByText("M")).toBeInTheDocument()
        expect(screen.getByText("L")).toBeInTheDocument()
        expect(screen.queryByText("S")).not.toBeInTheDocument()
        expect(screen.queryByText("XL")).not.toBeInTheDocument()
    })

    it("updates URL with single size when checkbox is checked", async () => {
        render(<SizeFilter availableSizes={availableSizes} />)

        const mCheckbox = screen.getByRole("checkbox", { name: /M/i })
        await act(async () => {
            await userEvent.click(mCheckbox)
        })

        expect(mockPush).toHaveBeenCalledTimes(1)
        const pushedUrl = mockPush.mock.calls[0][0]
        expect(pushedUrl).toContain("size=M")
    })

    it("updates URL with multiple sizes when multiple checkboxes are checked", async () => {
        // Simulate first checkbox click
        mockSearchParams.append("size", "M")

        render(<SizeFilter availableSizes={availableSizes} />)

        const lCheckbox = screen.getByRole("checkbox", { name: /^L$/i })
        await act(async () => {
            await userEvent.click(lCheckbox)
        })

        expect(mockPush).toHaveBeenCalledTimes(1)
        const pushedUrl = mockPush.mock.calls[0][0]
        expect(pushedUrl).toContain("size=M")
        expect(pushedUrl).toContain("size=L")
    })

    it("removes size from URL when checkbox is unchecked", async () => {
        // Simulate existing size in URL
        mockSearchParams.append("size", "M")
        mockSearchParams.append("size", "L")

        render(<SizeFilter availableSizes={availableSizes} />)

        const mCheckbox = screen.getByRole("checkbox", { name: /M/i })
        await act(async () => {
            await userEvent.click(mCheckbox)
        })

        expect(mockPush).toHaveBeenCalledTimes(1)
        const pushedUrl = mockPush.mock.calls[0][0]
        expect(pushedUrl).not.toContain("size=M")
        expect(pushedUrl).toContain("size=L")
    })

    it("preserves other searchParams when updating size", async () => {
        mockSearchParams.set("category", "ropa")
        mockSearchParams.set("search", "remera")

        render(<SizeFilter availableSizes={availableSizes} />)

        const mCheckbox = screen.getByRole("checkbox", { name: /M/i })
        await act(async () => {
            await userEvent.click(mCheckbox)
        })

        expect(mockPush).toHaveBeenCalledTimes(1)
        const pushedUrl = mockPush.mock.calls[0][0]
        expect(pushedUrl).toContain("category=ropa")
        expect(pushedUrl).toContain("search=remera")
        expect(pushedUrl).toContain("size=M")
    })

    it("renders checkboxes as unchecked when no sizes in URL", () => {
        render(<SizeFilter availableSizes={availableSizes} />)

        availableSizes.forEach(size => {
            const checkbox = screen.getByRole("checkbox", { name: new RegExp(`^${size}$`, "i") })
            expect(checkbox).not.toBeChecked()
        })
    })

    it("renders checkboxes as checked when sizes are in URL", () => {
        mockSearchParams.append("size", "M")
        mockSearchParams.append("size", "L")

        render(<SizeFilter availableSizes={availableSizes} />)

        const mCheckbox = screen.getByRole("checkbox", { name: /^M$/i })
        const lCheckbox = screen.getByRole("checkbox", { name: /^L$/i })
        const sCheckbox = screen.getByRole("checkbox", { name: /^S$/i })
        const xlCheckbox = screen.getByRole("checkbox", { name: /^XL$/i })

        expect(mCheckbox).toBeChecked()
        expect(lCheckbox).toBeChecked()
        expect(sCheckbox).not.toBeChecked()
        expect(xlCheckbox).not.toBeChecked()
    })

    it("renders empty state when no sizes available", () => {
        render(<SizeFilter availableSizes={[]} />)

        expect(screen.queryByRole("checkbox")).not.toBeInTheDocument()
    })
})
