package com.psddev.cms.db;

import java.util.Arrays;
import java.util.List;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.psddev.dari.db.ApplicationFilter;
import com.psddev.dari.db.Recordable;
import com.psddev.dari.util.AbstractFilter;
import com.psddev.dari.util.WebPageContext;

public class ViewModelFilter extends AbstractFilter implements AbstractFilter.Auto {

    @Override
    protected void doInclude(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws Exception {
        WebPageContext page = new WebPageContext(getServletContext(), request, response);
        ViewModel<? extends Recordable> viewModel = ViewModel.Static.getInstance(page, request.getAttribute("object"), request.getParameter("context"));
        request.setAttribute("viewmodel", viewModel);
        super.doInclude(request, response, chain);
    }

    @Override
    public void updateDependencies(Class<? extends AbstractFilter> filterClass, List<Class<? extends Filter>> dependencies) {
        if (PageFilter.class.isAssignableFrom(filterClass)) {
            dependencies.add(getClass());
        }
    }

    @Override
    protected Iterable<Class<? extends Filter>> dependencies() {
        return Arrays.asList(ApplicationFilter.class);
    }
}
